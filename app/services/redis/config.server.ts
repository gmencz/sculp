import { Redis } from "ioredis";
import { env } from "~/utils/env.server";

export const redis = new Redis({
  host: env.REDIS_HOST,
  family: env.NODE_ENV === "production" ? 6 : undefined,
  password: env.REDIS_PASSWORD,
});
