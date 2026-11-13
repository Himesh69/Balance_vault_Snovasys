import { OnboardingStatus, AccountStatus, AccountType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuditService } from './AuditService.js';
import { AppError } from '../lib/AppError.js';

export interface UpdateOnboardingDraftDTO {
  legalName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  occupation?: string;
  sourceOfFunds?: string;
  documentMetadata?: any;
}

export class OnboardingService {
  /**
   * Retrieves onboarding data for a user
   */
  static async getOnboarding(userId: string) {
    let onboarding = await prisma.onboarding.findUnique({
      where: { userId },
      include: {
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!onboarding) {
      // Create draft if missing
      onboarding = await prisma.onboarding.create({
        data: {
          userId,
          status: OnboardingStatus.DRAFT,
        },
        include: {
          reviewedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    }

    return onboarding;
  }

  /**
   * Updates onboarding draft (User action). Allowed in DRAFT or REJECTED status.
   */
  static async saveDraft(
    userId: string,
    data: UpdateOnboardingDraftDTO,
    options?: { ip?: string; userAgent?: string }
  ) {
    const current = await this.getOnboarding(userId);

    if (current.status === OnboardingStatus.SUBMITTED) {
      throw new AppError('Cannot edit onboarding while application is pending review', 400);
    }

    if (current.status === OnboardingStatus.APPROVED) {
      throw new AppError('Onboarding application has already been approved', 400);
    }

    const updated = await prisma.onboarding.update({
      where: { userId },
      data: {
        ...data,
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'ONBOARDING_DRAFT_UPDATED',
      resourceType: 'ONBOARDING',
      resourceId: updated.id,
      metadata: { fieldsUpdated: Object.keys(data) },
      ip: options?.ip,
      userAgent: options?.userAgent,
    });

    return updated;
  }

  /**
   * Submits onboarding application (User action).
   * Validates required fields, moves status from DRAFT or REJECTED to SUBMITTED.
   */
  static async submit(
    userId: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const current = await this.getOnboarding(userId);

    if (current.status === OnboardingStatus.SUBMITTED) {
      throw new AppError('Onboarding application is already submitted and pending review', 400);
    }

    if (current.status === OnboardingStatus.APPROVED) {
      throw new AppError('Onboarding application has already been approved', 400);
    }

    // Validate required fields for submission per PRD 6.2
    const requiredFields = [
      'legalName',
      'dateOfBirth',
      'phoneNumber',
      'streetAddress',
      'city',
      'country',
      'idType',
      'idNumber',
      'occupation',
      'sourceOfFunds',
    ] as const;

    const missing = requiredFields.filter((f) => !current[f] || String(current[f]).trim() === '');
    if (missing.length > 0) {
      throw new AppError(`Missing required onboarding fields: ${missing.join(', ')}`, 400);
    }

    const updated = await prisma.onboarding.update({
      where: { userId },
      data: {
        status: OnboardingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'ONBOARDING_SUBMITTED',
      resourceType: 'ONBOARDING',
      resourceId: updated.id,
      metadata: {
        previousStatus: current.status,
        newStatus: OnboardingStatus.SUBMITTED,
      },
      ip: options?.ip,
      userAgent: options?.userAgent,
    });

    return updated;
  }

  /**
   * Admin approves onboarding application.
   * Creates or activates user's primary account!
   */
  static async approve(
    onboardingId: string,
    adminId: string,
    reviewNotes?: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: { user: true },
    });

    if (!onboarding) {
      throw new AppError('Onboarding record not found', 404);
    }

    if (onboarding.status !== OnboardingStatus.SUBMITTED) {
      throw new AppError(`Cannot approve onboarding with status ${onboarding.status}. Must be SUBMITTED.`, 400);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update onboarding status
      const updated = await tx.onboarding.update({
        where: { id: onboardingId },
        data: {
          status: OnboardingStatus.APPROVED,
          reviewedById: adminId,
          reviewNotes: reviewNotes || 'Application approved',
          reviewedAt: new Date(),
        },
      });

      // 2. Create primary user account if none exists
      let account = await tx.account.findFirst({
        where: { userId: onboarding.userId, accountType: AccountType.USER },
      });

      if (!account) {
        // Generate account number: BV-USER-<random 6 digits>
        const accountNumber = `BV-${Math.floor(100000 + Math.random() * 900000)}`;
        account = await tx.account.create({
          data: {
            userId: onboarding.userId,
            accountNumber,
            status: AccountStatus.ACTIVE,
            currency: 'USD',
            accountType: AccountType.USER,
            cachedBalance: 0,
          },
        });

        await AuditService.log(
          {
            actorId: adminId,
            action: 'ACCOUNT_CREATED',
            resourceType: 'ACCOUNT',
            resourceId: account.id,
            metadata: {
              userId: onboarding.userId,
              accountNumber: account.accountNumber,
            },
            ip: options?.ip,
            userAgent: options?.userAgent,
          },
          tx
        );
      } else if (account.status === AccountStatus.PENDING) {
        account = await tx.account.update({
          where: { id: account.id },
          data: { status: AccountStatus.ACTIVE },
        });
      }

      // 3. Log Onboarding approval audit
      await AuditService.log(
        {
          actorId: adminId,
          action: 'ONBOARDING_APPROVED',
          resourceType: 'ONBOARDING',
          resourceId: updated.id,
          metadata: {
            applicantUserId: onboarding.userId,
            reviewNotes,
            createdAccountId: account?.id,
          },
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
        tx
      );

      return { onboarding: updated, account };
    });
  }

  /**
   * Admin rejects onboarding application with optional reason.
   */
  static async reject(
    onboardingId: string,
    adminId: string,
    reviewNotes?: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
    });

    if (!onboarding) {
      throw new AppError('Onboarding record not found', 404);
    }

    if (onboarding.status !== OnboardingStatus.SUBMITTED) {
      throw new AppError(`Cannot reject onboarding with status ${onboarding.status}. Must be SUBMITTED.`, 400);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.onboarding.update({
        where: { id: onboardingId },
        data: {
          status: OnboardingStatus.REJECTED,
          reviewedById: adminId,
          reviewNotes: reviewNotes || 'Application rejected',
          reviewedAt: new Date(),
        },
      });

      await AuditService.log(
        {
          actorId: adminId,
          action: 'ONBOARDING_REJECTED',
          resourceType: 'ONBOARDING',
          resourceId: updated.id,
          metadata: {
            applicantUserId: onboarding.userId,
            reviewNotes,
          },
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
        tx
      );

      return updated;
    });
  }
}

