import { Prisma, LedgerDirection, AccountStatus, AccountType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuditService } from './AuditService.js';

export interface EntryDraft {
  accountId: string;
  direction: LedgerDirection;
  amount: number; // Smallest currency unit (cents), must be > 0
}

export interface MovementOptions {
  reference?: string;
  description: string;
  createdById?: string;
  ip?: string;
  userAgent?: string;
}

export class LedgerService {
  /**
   * Finds or creates the default platform clearing account.
   */
  static async getPlatformClearingAccount(tx: Prisma.TransactionClient = prisma) {
    let clearing = await tx.account.findFirst({
      where: { accountType: AccountType.PLATFORM_CLEARING },
    });

    if (!clearing) {
      clearing = await tx.account.create({
        data: {
          accountNumber: 'ACC-CLEARING-001',
          currency: 'USD',
          accountType: AccountType.PLATFORM_CLEARING,
          status: AccountStatus.ACTIVE,
          cachedBalance: 0,
        },
      });
    }

    return clearing;
  }

  /**
   * Executes an atomic, balanced multi-entry ledger transaction.
   * Asserts:
   * 1. Entries count >= 2
   * 2. All amounts > 0 and integer
   * 3. SUM(debits) === SUM(credits)
   * 4. Accounts are ACTIVE
   * 5. Atomically updates cached balance and writes audit log
   */
  static async executeTransaction(
    entries: EntryDraft[],
    options: MovementOptions
  ) {
    if (!entries || entries.length < 2) {
      throw new Error('Ledger transaction must contain at least 2 entries');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
        throw new Error(`Invalid entry amount: ${entry.amount}. Must be positive integer.`);
      }

      if (entry.direction === LedgerDirection.DEBIT) {
        totalDebit += entry.amount;
      } else if (entry.direction === LedgerDirection.CREDIT) {
        totalCredit += entry.amount;
      } else {
        throw new Error(`Invalid ledger direction: ${entry.direction}`);
      }
    }

    // PRD Section 13: For every transaction: SUM(debit amounts) = SUM(credit amounts)
    if (totalDebit !== totalCredit) {
      throw new Error(
        `Ledger imbalance detected: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit})`
      );
    }

    const reference = options.reference || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Validate accounts and check balances
      const accountMap = new Map<string, any>();

      for (const entry of entries) {
        if (!accountMap.has(entry.accountId)) {
          const acc = await tx.account.findUnique({
            where: { id: entry.accountId },
          });

          if (!acc) {
            throw new Error(`Account not found: ${entry.accountId}`);
          }

          if (acc.status !== AccountStatus.ACTIVE) {
            throw new Error(`Account ${acc.accountNumber} is not ACTIVE (status: ${acc.status})`);
          }

          accountMap.set(entry.accountId, acc);
        }
      }

      // Check user debit balance availability
      for (const entry of entries) {
        const acc = accountMap.get(entry.accountId);
        if (acc.accountType === AccountType.USER && entry.direction === LedgerDirection.DEBIT) {
          if (acc.cachedBalance < entry.amount) {
            throw new Error(
              `Insufficient funds in account ${acc.accountNumber}. Available: ${acc.cachedBalance}, requested: ${entry.amount}`
            );
          }
        }
      }

      // 2. Create LedgerTransaction
      const transaction = await tx.ledgerTransaction.create({
        data: {
          reference,
          description: options.description,
          createdById: options.createdById,
          entries: {
            create: entries.map((e) => ({
              accountId: e.accountId,
              direction: e.direction,
              amount: e.amount,
            })),
          },
        },
        include: {
          entries: {
            include: {
              account: true,
            },
          },
        },
      });

      // 3. Update cached balances
      for (const entry of entries) {
        const acc = accountMap.get(entry.accountId);
        // For USER accounts: CREDIT increases balance, DEBIT decreases balance
        // For PLATFORM_CLEARING: DEBIT increases platform clearing asset, CREDIT decreases it
        let delta = 0;
        if (acc.accountType === AccountType.USER) {
          delta = entry.direction === LedgerDirection.CREDIT ? entry.amount : -entry.amount;
        } else {
          delta = entry.direction === LedgerDirection.DEBIT ? entry.amount : -entry.amount;
        }

        await tx.account.update({
          where: { id: entry.accountId },
          data: {
            cachedBalance: {
              increment: delta,
            },
          },
        });
      }

      // 4. Audit Log entry inside the same database transaction
      await AuditService.log(
        {
          actorId: options.createdById || 'SYSTEM',
          action: 'LEDGER_TRANSACTION_EXECUTED',
          resourceType: 'LEDGER_TRANSACTION',
          resourceId: transaction.id,
          metadata: {
            reference,
            description: options.description,
            totalDebit,
            totalCredit,
            entriesCount: entries.length,
            entries: entries.map((e) => ({
              accountId: e.accountId,
              direction: e.direction,
              amount: e.amount,
            })),
          },
          ip: options.ip,
          userAgent: options.userAgent,
        },
        tx
      );

      return transaction;
    });
  }

  /**
   * Credits user account (Deposit operation per PRD 6.3)
   * Double-entry: Debit Platform Clearing, Credit User Account
   */
  static async creditUserAccount(
    accountId: string,
    amount: number,
    options: MovementOptions
  ) {
    const clearingAccount = await this.getPlatformClearingAccount();

    const entries: EntryDraft[] = [
      {
        accountId: clearingAccount.id,
        direction: LedgerDirection.DEBIT,
        amount,
      },
      {
        accountId,
        direction: LedgerDirection.CREDIT,
        amount,
      },
    ];

    return await this.executeTransaction(entries, {
      ...options,
      description: options.description || `Deposit of ${amount} to account`,
    });
  }

  /**
   * Debits user account (Withdrawal operation per PRD 6.3)
   * Double-entry: Debit User Account, Credit Platform Clearing
   */
  static async debitUserAccount(
    accountId: string,
    amount: number,
    options: MovementOptions
  ) {
    const clearingAccount = await this.getPlatformClearingAccount();

    const entries: EntryDraft[] = [
      {
        accountId,
        direction: LedgerDirection.DEBIT,
        amount,
      },
      {
        accountId: clearingAccount.id,
        direction: LedgerDirection.CREDIT,
        amount,
      },
    ];

    return await this.executeTransaction(entries, {
      ...options,
      description: options.description || `Withdrawal of ${amount} from account`,
    });
  }

  /**
   * Gets ledger statement for an account
   */
  static async getAccountLedger(accountId: string) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { accountId },
      include: {
        transaction: {
          include: {
            entries: {
              include: {
                account: {
                  select: {
                    id: true,
                    accountNumber: true,
                    accountType: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return entries;
  }
}

