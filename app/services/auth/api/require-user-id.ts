import type { User } from "@prisma/client";
import { getSessionFromCookie } from "../../../utils/session.server";
import { redirect } from "@remix-run/server-runtime";
import { configRoutes } from "~/utils/routes";

export async function getUserId(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getSessionFromCookie(request);
  const userId = session.get("userId");
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect(
      configRoutes.auth.signIn +
        `?redirect_to=${encodeURIComponent(redirectTo)}`
    );
  }
  return userId;
}
