import { redirect } from "@remix-run/server-runtime";
import { getSessionFromCookie, sessionStorage } from "~/utils/session.server";
import { configRoutes } from "~/utils/routes";

export async function signOut(request: Request) {
  const session = await getSessionFromCookie(request);
  return redirect(configRoutes.home, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
