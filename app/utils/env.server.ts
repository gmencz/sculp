import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PRICE_ID: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_CUSTOMER_PORTAL_LINK: z.string(),
  HOST_URL: z.string(),
  RESEND_API_KEY: z.string(),
  RESEND_NO_REPLY_EMAIL_SENDER: z.string(),
  PASSWORD_RESET_JWT_SECRET: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PASSWORD: z.string(),
  STRIPE_CHECKOUT_JWT_SECRET: z.string(),
  SENTRY_DSN: z.string(),

  // Only for running the production prisma seed.
  PRISMA_SEED_ADMIN_EMAIL: z.string().optional(),
  PRISMA_SEED_ADMIN_PASSWORD: z.string().optional(),
  PRISMA_SEED_ADMIN_STRIPE_CUSTOMER_ID: z.string().optional(),
  PRISMA_SEED_ADMIN_STRIPE_SUBSCRIPTION_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
