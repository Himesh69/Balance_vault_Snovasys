import Redis from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// ponytail: Memory-backed rate limit store fallback when Redis is unreachable or during local dev/tests.
// Ceiling: Single-node in-memory store; will reset on process restart and not shared across horizontal instances.
// Upgrade path: Dedicated Redis cluster or AWS ElastiCache for multi-instance distributed deployments.
const memoryStore = new Map<string, { count: number; resetAt: number }>();

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't crash loop if Redis is not running
    connectTimeout: 1000,
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('Connected to Redis server');
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Suppress spammy reconnection errors
  });
} catch (error) {
  isRedisAvailable = false;
}

export interface RateLimiterResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetInSeconds: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimiterResult> {
  const fullKey = `rl:${key}`;
  const now = Math.floor(Date.now() / 1000);

  if (isRedisAvailable && redisClient) {
    try {
      const current = await redisClient.incr(fullKey);
      if (current === 1) {
        await redisClient.expire(fullKey, windowSeconds);
      }
      const ttl = await redisClient.ttl(fullKey);
      const remaining = Math.max(0, limit - current);

      return {
        allowed: current <= limit,
        current,
        remaining,
        resetInSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch {
      // Redis error mid-flight -> fallback to memory
    }
  }

  // Memory fallback
  const record = memoryStore.get(fullKey);
  if (!record || record.resetAt <= now) {
    memoryStore.set(fullKey, { count: 1, resetAt: now + windowSeconds });
    return {
      allowed: true,
      current: 1,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  record.count += 1;
  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  const resetInSeconds = Math.max(0, record.resetAt - now);

  return {
    allowed,
    current: record.count,
    remaining,
    resetInSeconds,
  };
}

export { redisClient };

