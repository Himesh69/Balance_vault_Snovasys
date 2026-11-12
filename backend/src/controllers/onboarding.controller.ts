import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OnboardingService } from '../services/OnboardingService.js';

const draftSchema = z.object({
  legalName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phoneNumber: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  occupation: z.string().optional(),
  sourceOfFunds: z.string().optional(),
  documentMetadata: z.any().optional(),
});

export class OnboardingController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const onboarding = await OnboardingService.getOnboarding(req.user.userId);
      res.status(200).json({
        success: true,
        data: onboarding,
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const data = draftSchema.parse(req.body);
      const updated = await OnboardingService.saveDraft(req.user.userId, data, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updated = await OnboardingService.submit(req.user.userId, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

