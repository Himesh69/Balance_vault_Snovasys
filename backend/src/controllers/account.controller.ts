import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/AccountService.js';
import { Role } from '@prisma/client';

const movementSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer in cents'),
  description: z.string().min(1, 'Description is required'),
});

export class AccountController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const accounts = await AccountService.getAccountsForUser(req.user.userId);
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const account = await AccountService.getAccountById(req.params.id);

      // Ownership check: Account holder can only view their own account
      if (req.user.role !== Role.ADMIN && account.userId !== req.user.userId) {
        res.status(403).json({ success: false, error: 'Access denied: not your account' });
        return;
      }

      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLedger(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const account = await AccountService.getAccountById(req.params.id);

      if (req.user.role !== Role.ADMIN && account.userId !== req.user.userId) {
        res.status(403).json({ success: false, error: 'Access denied: not your account' });
        return;
      }

      const ledger = await AccountService.getLedger(req.params.id);
      res.status(200).json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      next(error);
    }
  }

  static async credit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const account = await AccountService.getAccountById(req.params.id);

      if (req.user.role !== Role.ADMIN && account.userId !== req.user.userId) {
        res.status(403).json({ success: false, error: 'Access denied: not your account' });
        return;
      }

      const data = movementSchema.parse(req.body);
      const transaction = await AccountService.creditAccount(
        req.params.id,
        data.amount,
        req.user.userId,
        data.description,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  static async debit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const account = await AccountService.getAccountById(req.params.id);

      if (req.user.role !== Role.ADMIN && account.userId !== req.user.userId) {
        res.status(403).json({ success: false, error: 'Access denied: not your account' });
        return;
      }

      const data = movementSchema.parse(req.body);
      const transaction = await AccountService.debitAccount(
        req.params.id,
        data.amount,
        req.user.userId,
        data.description,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }
}

