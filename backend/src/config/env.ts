import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().default('postgresql://balancevault_app:app_secret_pass@localhost:5432/balancevault?schema=public'),
  DATABASE_URL_MIGRATE: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16).default('super_secure_jwt_secret_balancevault_2026'),
  JWT_EXPIRES_IN: z.string().default('1h'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

