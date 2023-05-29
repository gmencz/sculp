import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PRICE_ID: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_CUSTOMER_PORTAL_LINK: z.string(),
  HOST_URL: z.string(),
});

export const env = envSchema.parse(process.env);
