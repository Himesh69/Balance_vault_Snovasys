import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { Role } from '@prisma/client';

const router = Router();

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticate, requireRole(Role.ADMIN));

// User management
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUser);
router.patch(
  '/users/:id',
  rateLimiter({ keyPrefix: 'admin:users:status', limit: 30, windowSeconds: 60 }),
  AdminController.updateUserStatus
);
router.delete(
  '/users/:id',
  rateLimiter({ keyPrefix: 'admin:users:delete', limit: 10, windowSeconds: 60 }),
  AdminController.deleteUser
);

// Onboarding review
router.get('/onboarding', AdminController.listOnboardings);
router.post(
  '/onboarding/:id/approve',
  rateLimiter({ keyPrefix: 'admin:onboarding:approve', limit: 30, windowSeconds: 60 }),
  AdminController.approveOnboarding
);
router.post(
  '/onboarding/:id/reject',
  rateLimiter({ keyPrefix: 'admin:onboarding:reject', limit: 30, windowSeconds: 60 }),
  AdminController.rejectOnboarding
);

// Account management
router.patch(
  '/accounts/:id',
  rateLimiter({ keyPrefix: 'admin:accounts:status', limit: 30, windowSeconds: 60 }),
  AdminController.updateAccountStatus
);
router.delete(
  '/accounts/:id',
  rateLimiter({ keyPrefix: 'admin:accounts:delete', limit: 10, windowSeconds: 60 }),
  AdminController.deleteAccount
);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;

