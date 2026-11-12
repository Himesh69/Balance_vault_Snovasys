import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', AccountController.list);
router.get('/:id', AccountController.getById);
router.get('/:id/ledger', AccountController.getLedger);

// Sensitive financial mutations rate-limited: 30 requests per minute
router.post(
  '/:id/credit',
  rateLimiter({ keyPrefix: 'accounts:credit', limit: 30, windowSeconds: 60 }),
  AccountController.credit
);

router.post(
  '/:id/debit',
  rateLimiter({ keyPrefix: 'accounts:debit', limit: 30, windowSeconds: 60 }),
  AccountController.debit
);

export default router;

