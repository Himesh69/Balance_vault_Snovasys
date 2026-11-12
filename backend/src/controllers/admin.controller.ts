import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminService } from '../services/AdminService.js';
import { OnboardingService } from '../services/OnboardingService.js';
import { AccountService } from '../services/AccountService.js';
import { AuditService } from '../services/AuditService.js';
import { UserStatus, AccountStatus, OnboardingStatus } from '@prisma/client';

const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

const updateAccountStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

const reviewOnboardingSchema = z.object({
  reviewNotes: z.string().optional(),
});

export class AdminController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as UserStatus | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await AdminService.listUsers({ search, status, limit, offset });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.getUserDetail(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserStatusSchema.parse(req.body);
      const user = await AdminService.updateUserStatus(
        req.params.id,
        data.status,
        req.user!.userId,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.hardDeleteUser(req.params.id, req.user!.userId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listOnboardings(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as OnboardingStatus | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await AdminService.listOnboardings({ status, limit, offset });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async approveOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const data = reviewOnboardingSchema.parse(req.body);
      const result = await OnboardingService.approve(
        req.params.id,
        req.user!.userId,
        data.reviewNotes,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async rejectOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const data = reviewOnboardingSchema.parse(req.body);
      const result = await OnboardingService.reject(
        req.params.id,
        req.user!.userId,
        data.reviewNotes,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateAccountStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateAccountStatusSchema.parse(req.body);
      const result = await AccountService.updateAccountStatus(
        req.params.id,
        data.status,
        req.user!.userId,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AccountService.hardDeleteAccount(req.params.id, req.user!.userId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.query.actorId as string | undefined;
      const action = req.query.action as string | undefined;
      const resourceType = req.query.resourceType as string | undefined;
      const resourceId = req.query.resourceId as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await AuditService.queryLogs({
        actorId,
        action,
        resourceType,
        resourceId,
        startDate,
        endDate,
        limit,
        offset,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

