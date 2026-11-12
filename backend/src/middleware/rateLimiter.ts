import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../lib/redis.js';

export function rateLimiter(options: {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Determine client identifier (user ID if authenticated, else client IP)
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = req.user?.userId || clientIp;
    const rateLimitKey = `${options.keyPrefix}:${identifier}`;

    try {
      const result = await checkRateLimit(
        rateLimitKey,
        options.limit,
        options.windowSeconds
      );

      res.setHeader('X-RateLimit-Limit', options.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetInSeconds.toString());

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please slow down.',
          retryAfter: result.resetInSeconds,
        });
        return;
      }

      next();
    } catch (error) {
      // Fail-open strategy if rate limiting fails completely so legitimate requests aren't permanently bricked
      next();
    }
  };
}

