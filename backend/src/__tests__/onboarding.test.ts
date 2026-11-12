import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from '../services/OnboardingService.js';
import { OnboardingStatus, AccountStatus, AccountType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => {
  return {
    prisma: {
      onboarding: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      account: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

describe('Onboarding State Machine (PRD Section 6.2 & 12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents saving draft if status is SUBMITTED', async () => {
    vi.mocked(prisma.onboarding.findUnique).mockResolvedValueOnce({
      id: 'onb-1',
      userId: 'user-1',
      status: OnboardingStatus.SUBMITTED,
    } as any);

    await expect(
      OnboardingService.saveDraft('user-1', { legalName: 'New Name' })
    ).rejects.toThrow('Cannot edit onboarding while application is pending review');
  });

  it('prevents submitting if missing required fields', async () => {
    vi.mocked(prisma.onboarding.findUnique).mockResolvedValueOnce({
      id: 'onb-1',
      userId: 'user-1',
      status: OnboardingStatus.DRAFT,
      legalName: 'Alice Doe',
      // missing DOB, phone, address, etc.
    } as any);

    await expect(OnboardingService.submit('user-1')).rejects.toThrow(
      /Missing required onboarding fields/
    );
  });

  it('successfully transitions from DRAFT to SUBMITTED when all fields are present', async () => {
    vi.mocked(prisma.onboarding.findUnique).mockResolvedValueOnce({
      id: 'onb-1',
      userId: 'user-1',
      status: OnboardingStatus.DRAFT,
      legalName: 'Alice Doe',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+1234567890',
      streetAddress: '123 Wall St',
      city: 'New York',
      country: 'USA',
      idType: 'Passport',
      idNumber: 'A12345678',
      occupation: 'Engineer',
      sourceOfFunds: 'Salary',
    } as any);

    vi.mocked(prisma.onboarding.update).mockResolvedValueOnce({
      id: 'onb-1',
      userId: 'user-1',
      status: OnboardingStatus.SUBMITTED,
      submittedAt: new Date(),
    } as any);

    const result = await OnboardingService.submit('user-1');
    expect(result.status).toBe(OnboardingStatus.SUBMITTED);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ONBOARDING_SUBMITTED',
        }),
      })
    );
  });

  it('allows Admin to approve SUBMITTED onboarding and automatically creates primary account', async () => {
    vi.mocked(prisma.onboarding.findUnique).mockResolvedValueOnce({
      id: 'onb-1',
      userId: 'user-1',
      status: OnboardingStatus.SUBMITTED,
      user: { id: 'user-1', email: 'alice@example.com' },
    } as any);

    vi.mocked(prisma.onboarding.update).mockResolvedValueOnce({
      id: 'onb-1',
      status: OnboardingStatus.APPROVED,
    } as any);

    vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null); // No account yet
    vi.mocked(prisma.account.create).mockResolvedValueOnce({
      id: 'acc-new-1',
      accountNumber: 'BV-987654',
      status: AccountStatus.ACTIVE,
      cachedBalance: 0,
      accountType: AccountType.USER,
    } as any);

    const result = await OnboardingService.approve('onb-1', 'admin-id', 'Looks good');

    expect(result.onboarding.status).toBe(OnboardingStatus.APPROVED);
    expect(result.account?.accountNumber).toBe('BV-987654');
    expect(prisma.account.create).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ONBOARDING_APPROVED',
        }),
      })
    );
  });

  it('allows Admin to reject SUBMITTED onboarding with reason', async () => {
    vi.mocked(prisma.onboarding.findUnique).mockResolvedValueOnce({
      id: 'onb-1',
      userId: 'user-1',
      status: OnboardingStatus.SUBMITTED,
    } as any);

    vi.mocked(prisma.onboarding.update).mockResolvedValueOnce({
      id: 'onb-1',
      status: OnboardingStatus.REJECTED,
      reviewNotes: 'ID document unclear',
    } as any);

    const result = await OnboardingService.reject('onb-1', 'admin-id', 'ID document unclear');
    expect(result.status).toBe(OnboardingStatus.REJECTED);
    expect(result.reviewNotes).toBe('ID document unclear');
  });
});

