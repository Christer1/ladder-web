// Reads and validates NEXT_PUBLIC_* env vars with Zod; exports typed env.
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url().default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

// Each var is referenced explicitly so Next.js can inline it into the client bundle.
const parsed = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS,
});

export const env = {
  apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, ''),
  useMocks: parsed.NEXT_PUBLIC_USE_MOCKS,
} as const;
