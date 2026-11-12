import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', OnboardingController.get);
router.put('/', OnboardingController.saveDraft);
router.post(
  '/submit',
  rateLimiter({ keyPrefix: 'onboarding:submit', limit: 10, windowSeconds: 60 }),
  OnboardingController.submit
);

export default router;

