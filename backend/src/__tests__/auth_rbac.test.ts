import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../middleware/rbac.js';
import { authenticate } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

describe('Auth & RBAC Middleware (PRD Section 4, 6.1, 11)', () => {
  it('authenticate rejects requests with no Authorization header', () => {
    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Missing or invalid Authorization header' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('authenticate passes valid tokens and sets req.user', () => {
    const payload = { userId: 'u-1', email: 'test@example.com', role: Role.ACCOUNT_HOLDER };
    const token = jwt.sign(payload, env.JWT_SECRET);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res: any = {};
    const next = vi.fn();

    authenticate(req, res, next);
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('u-1');
    expect(req.user.role).toBe(Role.ACCOUNT_HOLDER);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole blocks unauthorized role with 403', () => {
    const req: any = {
      user: { userId: 'u-1', email: 'test@example.com', role: Role.ACCOUNT_HOLDER },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    const guard = requireRole(Role.ADMIN);
    guard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Forbidden') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole allows matching role to proceed', () => {
    const req: any = {
      user: { userId: 'u-admin', email: 'admin@example.com', role: Role.ADMIN },
    };
    const res: any = {};
    const next = vi.fn();

    const guard = requireRole(Role.ADMIN);
    guard(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

