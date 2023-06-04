import { prisma } from "~/utils/db.server";
import { requireUserId } from "./require-user-id";
import { redirect } from "@remix-run/server-runtime";
import { configRoutes } from "~/utils/routes";
import { signOut } from "./sign-out";

export async function requireUser(
  request: Request,
  options?: { ignoreSubscription: boolean }
) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscription: {
        select: { status: true },
      },
    },
  });

  if (user) {
    if (options?.ignoreSubscription) {
      return user;
    }

    // Check if the user has a valid subscription, if they don't redirect them to the error page.
    const successStatuses = ["trialing", "active"];
    if (
      !user.subscription ||
      !successStatuses.includes(user.subscription?.status)
    ) {
      throw redirect(configRoutes.auth.invalidSubscription);
    }

    return user;
  }

  throw await signOut(request);
}
