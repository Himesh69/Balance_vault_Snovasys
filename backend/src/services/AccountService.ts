import { AccountStatus, AccountType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuditService } from './AuditService.js';
import { LedgerService } from './LedgerService.js';

export class AccountService {
  static async getAccountsForUser(userId: string) {
    return await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAccountById(accountId: string) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  static async updateAccountStatus(
    accountId: string,
    status: AccountStatus,
    adminId: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const account = await this.getAccountById(accountId);

    const updated = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.update({
        where: { id: accountId },
        data: { status },
      });

      await AuditService.log(
        {
          actorId: adminId,
          action: 'ACCOUNT_STATUS_CHANGED',
          resourceType: 'ACCOUNT',
          resourceId: accountId,
          metadata: {
            previousStatus: account.status,
            newStatus: status,
          },
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
        tx
      );

      return acc;
    });

    return updated;
  }

  /**
   * Hard deletes an account (Admin only per PRD 6.3 & 11)
   * Hard deletes require careful cascade or restriction if ledger entries exist.
   */
  static async hardDeleteAccount(
    accountId: string,
    adminId: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    const account = await this.getAccountById(accountId);

    if (account.accountType === AccountType.PLATFORM_CLEARING) {
      throw new Error('Platform clearing account cannot be deleted');
    }

    // Business rule: Check if account has non-zero balance
    if (account.cachedBalance !== 0) {
      throw new Error(
        `Cannot delete account with non-zero balance (${account.cachedBalance} cents). Balance must be zero.`
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Delete associated ledger entries if cascading or restricted
      // In hard deletes, remove ledger entries referencing this account
      await tx.ledgerEntry.deleteMany({
        where: { accountId },
      });

      const deleted = await tx.account.delete({
        where: { id: accountId },
      });

      await AuditService.log(
        {
          actorId: adminId,
          action: 'ACCOUNT_HARD_DELETED',
          resourceType: 'ACCOUNT',
          resourceId: accountId,
          metadata: {
            accountNumber: account.accountNumber,
            userId: account.userId,
          },
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
        tx
      );

      return deleted;
    });
  }

  static async creditAccount(
    accountId: string,
    amount: number,
    actorId: string,
    description: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    return await LedgerService.creditUserAccount(accountId, amount, {
      description,
      createdById: actorId,
      ip: options?.ip,
      userAgent: options?.userAgent,
    });
  }

  static async debitAccount(
    accountId: string,
    amount: number,
    actorId: string,
    description: string,
    options?: { ip?: string; userAgent?: string }
  ) {
    return await LedgerService.debitUserAccount(accountId, amount, {
      description,
      createdById: actorId,
      ip: options?.ip,
      userAgent: options?.userAgent,
    });
  }

  static async getLedger(accountId: string) {
    return await LedgerService.getAccountLedger(accountId);
  }
}

