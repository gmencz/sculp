import { createCookieSessionStorage } from "@remix-run/node";
import { env } from "~/utils/env.server";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [env.SESSION_SECRET],
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
});

export async function getSessionFromCookie(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export const { getSession, commitSession, destroySession } = sessionStorage;
