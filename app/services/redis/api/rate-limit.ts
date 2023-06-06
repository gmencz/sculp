import * as Sentry from "@sentry/remix";
import { env } from "~/utils/env.server";
import { redis } from "../config.server";

interface RateLimiterConfig {
  max: number;
  windowInSeconds: number;
  uid?: string;
}

export async function rateLimit(request: Request, config: RateLimiterConfig) {
  const url = new URL(request.url);
  const id =
    env.NODE_ENV === "production"
      ? request.headers.get("Fly-Client-IP")
      : "127.0.0.1";

  const key = `rate-limiter:${config.uid || url.pathname}:${id}`;
  let res: number;
  try {
    res = await redis.incr(key);
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }

  if (res > config.max) {
    throw new Response("Too Many Requests", {
      status: 429,
    });
  }

  if (res === 1) {
    redis.expire(key, config.windowInSeconds);
  }

  return false;
}
