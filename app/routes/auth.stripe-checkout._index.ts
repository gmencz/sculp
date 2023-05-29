import type { LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { configRoutes } from "~/config-routes";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return redirect(configRoutes.auth.getStarted);
  }

  // const session = await stripe.checkout.sessions.retrieve(sessionId);

  return null;
};
