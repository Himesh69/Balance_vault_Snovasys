import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerService, EntryDraft } from '../services/LedgerService.js';
import { LedgerDirection, AccountStatus, AccountType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => {
  return {
    prisma: {
      account: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      ledgerTransaction: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

describe('LedgerService - Double Entry Invariants (PRD Section 13)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject a transaction with fewer than 2 entries', async () => {
    const entries: EntryDraft[] = [
      {
        accountId: 'acc-1',
        direction: LedgerDirection.DEBIT,
        amount: 1000,
      },
    ];

    await expect(
      LedgerService.executeTransaction(entries, { description: 'Single entry test' })
    ).rejects.toThrow('Ledger transaction must contain at least 2 entries');
  });

  it('should reject negative or zero amounts', async () => {
    const entries: EntryDraft[] = [
      {
        accountId: 'acc-1',
        direction: LedgerDirection.DEBIT,
        amount: -500,
      },
      {
        accountId: 'acc-2',
        direction: LedgerDirection.CREDIT,
        amount: -500,
      },
    ];

    await expect(
      LedgerService.executeTransaction(entries, { description: 'Negative test' })
    ).rejects.toThrow('Must be positive integer');
  });

  it('should reject transactions where total debit !== total credit (imbalance check)', async () => {
    const entries: EntryDraft[] = [
      {
        accountId: 'acc-1',
        direction: LedgerDirection.DEBIT,
        amount: 1000,
      },
      {
        accountId: 'acc-2',
        direction: LedgerDirection.CREDIT,
        amount: 900, // Imbalance of 100
      },
    ];

    await expect(
      LedgerService.executeTransaction(entries, { description: 'Imbalanced test' })
    ).rejects.toThrow(/Ledger imbalance detected/);
  });

  it('should reject transactions on non-active accounts', async () => {
    const entries: EntryDraft[] = [
      {
        accountId: 'acc-1',
        direction: LedgerDirection.DEBIT,
        amount: 500,
      },
      {
        accountId: 'acc-2',
        direction: LedgerDirection.CREDIT,
        amount: 500,
      },
    ];

    vi.mocked(prisma.account.findUnique).mockResolvedValueOnce({
      id: 'acc-1',
      accountNumber: 'BV-111111',
      status: AccountStatus.SUSPENDED, // Suspended!
      accountType: AccountType.USER,
      cachedBalance: 1000,
    } as any);

    await expect(
      LedgerService.executeTransaction(entries, { description: 'Suspended account test' })
    ).rejects.toThrow(/is not ACTIVE/);
  });

  it('should reject user debit if funds are insufficient', async () => {
    const entries: EntryDraft[] = [
      {
        accountId: 'user-acc',
        direction: LedgerDirection.DEBIT,
        amount: 5000, // Wants 5000 cents
      },
      {
        accountId: 'clearing-acc',
        direction: LedgerDirection.CREDIT,
        amount: 5000,
      },
    ];

    vi.mocked(prisma.account.findUnique)
      .mockResolvedValueOnce({
        id: 'user-acc',
        accountNumber: 'BV-USER-1',
        status: AccountStatus.ACTIVE,
        accountType: AccountType.USER,
        cachedBalance: 1000, // Only has 1000 cents!
      } as any)
      .mockResolvedValueOnce({
        id: 'clearing-acc',
        accountNumber: 'ACC-CLEARING-001',
        status: AccountStatus.ACTIVE,
        accountType: AccountType.PLATFORM_CLEARING,
        cachedBalance: 100000,
      } as any);

    await expect(
      LedgerService.executeTransaction(entries, { description: 'Overdraft test' })
    ).rejects.toThrow(/Insufficient funds/);
  });

  it('should successfully execute balanced transaction and audit it', async () => {
    const entries: EntryDraft[] = [
      {
        accountId: 'clearing-acc',
        direction: LedgerDirection.DEBIT,
        amount: 2500,
      },
      {
        accountId: 'user-acc',
        direction: LedgerDirection.CREDIT,
        amount: 2500,
      },
    ];

    vi.mocked(prisma.account.findUnique)
      .mockResolvedValueOnce({
        id: 'clearing-acc',
        accountNumber: 'ACC-CLEARING-001',
        status: AccountStatus.ACTIVE,
        accountType: AccountType.PLATFORM_CLEARING,
        cachedBalance: 0,
      } as any)
      .mockResolvedValueOnce({
        id: 'user-acc',
        accountNumber: 'BV-USER-1',
        status: AccountStatus.ACTIVE,
        accountType: AccountType.USER,
        cachedBalance: 1000,
      } as any);

    vi.mocked(prisma.ledgerTransaction.create).mockResolvedValueOnce({
      id: 'txn-123',
      reference: 'TXN-REF-1',
      description: 'Deposit 25.00',
      createdById: 'user-1',
      createdAt: new Date(),
      entries: entries as any,
    } as any);

    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({
      id: 'audit-1',
      action: 'LEDGER_TRANSACTION_EXECUTED',
    } as any);

    const result = await LedgerService.executeTransaction(entries, {
      description: 'Deposit 25.00',
      createdById: 'user-1',
    });

    expect(result.id).toBe('txn-123');
    // Verify cached balance was updated
    expect(prisma.account.update).toHaveBeenCalledTimes(2);
    // Verify audit log was recorded
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LEDGER_TRANSACTION_EXECUTED',
          resourceType: 'LEDGER_TRANSACTION',
        }),
      })
    );
  });
});

