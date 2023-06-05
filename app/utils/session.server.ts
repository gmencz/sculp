import { createCookieSessionStorage } from "@remix-run/node";
import { env } from "~/utils/env.server";
import { generateId } from "./ids";

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

export function getSessionFromCookie(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

type GlobalNotification = {
  id: string;
  type: "success" | "error";
  message: string;
};

export async function flashGlobalNotification(
  request: Request,
  notification: Omit<GlobalNotification, "id">
) {
  const session = await getSessionFromCookie(request);
  session.flash("globalNotification", { ...notification, id: generateId() });
  return session;
}

export async function getGlobalNotification(request: Request) {
  const session = await getSessionFromCookie(request);
  const notification = session.get("globalNotification");
  if (!notification) return null;
  return notification as GlobalNotification;
}

export const { getSession, commitSession, destroySession } = sessionStorage;
