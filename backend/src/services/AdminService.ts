import { UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuditService } from './AuditService.js';
import { AppError } from '../lib/AppError.js';

export class AdminService {
  static async listUsers(options: {
    search?: string;
    status?: UserStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { fullName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          onboarding: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
            },
          },
          accounts: {
            select: {
              id: true,
              accountNumber: true,
              status: true,
              cachedBalance: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
    ]);

    return { total, users };
  }

  static async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        onboarding: true,
        accounts: true,
        auditLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Exclude password hash from response
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminId: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { status },
      });

      await AuditService.log(
        {
          actorId: adminId,
          action: 'USER_STATUS_UPDATED',
          resourceType: 'USER',
          resourceId: userId,
          metadata: {
            previousStatus: user.status,
            newStatus: status,
          },
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
        tx
      );

      return u;
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      status: updated.status,
    };
  }

  static async hardDeleteUser(
    userId: string,
    adminId: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user has non-zero balances in any accounts
    const nonZeroAccount = user.accounts.find((a) => a.cachedBalance !== 0);
    if (nonZeroAccount) {
      throw new AppError(
        `Cannot delete user with non-zero account balance (Account ${nonZeroAccount.accountNumber} has ${nonZeroAccount.cachedBalance} cents)`,
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Delete associated ledger entries for user's accounts
      for (const account of user.accounts) {
        await tx.ledgerEntry.deleteMany({
          where: { accountId: account.id },
        });
      }

      // 2. Delete user's accounts
      await tx.account.deleteMany({
        where: { userId },
      });

      // 3. Delete onboarding
      await tx.onboarding.deleteMany({
        where: { userId },
      });

      // 4. Delete user
      const deleted = await tx.user.delete({
        where: { id: userId },
      });

      // 5. Audit log
      await AuditService.log(
        {
          actorId: adminId,
          action: 'USER_HARD_DELETED',
          resourceType: 'USER',
          resourceId: userId,
          metadata: {
            deletedEmail: user.email,
            deletedFullName: user.fullName,
          },
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
        tx
      );

      return { success: true, message: `User ${user.email} hard-deleted successfully` };
    });
  }

  static async listOnboardings(options: {
    status?: any;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.OnboardingWhereInput = {};
    if (options.status) {
      where.status = options.status;
    }

    const [total, onboardings] = await Promise.all([
      prisma.onboarding.count({ where }),
      prisma.onboarding.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              status: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
    ]);

    return { total, onboardings };
  }
}

