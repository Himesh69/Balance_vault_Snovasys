import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Rate limiting: 10 registrations per 15 minutes per IP
router.post(
  '/register',
  rateLimiter({ keyPrefix: 'auth:register', limit: 10, windowSeconds: 900 }),
  AuthController.register
);

// Rate limiting: 5 logins per 60 seconds per IP
router.post(
  '/login',
  rateLimiter({ keyPrefix: 'auth:login', limit: 5, windowSeconds: 60 }),
  AuthController.login
);

// Authenticated route
router.get('/me', authenticate, AuthController.me);

export default router;

