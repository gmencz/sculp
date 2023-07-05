import { prisma } from "~/utils/db.server";
import { requireUserId } from "./require-user-id";
import { redirect } from "@remix-run/server-runtime";
import { configRoutes } from "~/utils/routes";
import { signOut } from "./sign-out";
import { stripe } from "~/services/stripe/config.server";
import { differenceInDays } from "date-fns";

export async function requireUser(
  request: Request,
  options?: {
    ignoreSubscription?: boolean;
    select?: Partial<{
      weightUnitPreference: boolean;
      trackRir: boolean;
      themePreference: boolean;
    }>;
  }
) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscriptionCheckedAt: true,
      weightUnitPreference: Boolean(options?.select?.weightUnitPreference),
      trackRir: Boolean(options?.select?.trackRir),
      themePreference: Boolean(options?.select?.trackRir),
      subscription: {
        select: { id: true, status: true },
      },
    },
  });

  if (user) {
    if (options?.ignoreSubscription) {
      return user;
    }

    if (!user.subscription) {
      throw redirect(configRoutes.auth.invalidSubscription);
    }

    // Check if the user has a valid subscription, if they don't redirect them to the error page.
    const successStatuses = ["trialing", "active"];

    // Check if it's been 1 day or more since we last checked the user's subscription from stripe.
    // This is just to make sure Stripe stays in sync with our database, it normally would
    // because of the webhook but we're using this as a failover recovery strategy.
    const now = new Date();
    if (differenceInDays(now, user.subscriptionCheckedAt) >= 1) {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.id
      );

      const [updatedSubscription] = await prisma.$transaction([
        prisma.subscription.update({
          where: {
            userId: user.id,
          },
          data: {
            status: { set: subscription.status },
            currentPeriodStart: { set: subscription.current_period_start },
            currentPeriodEnd: { set: subscription.current_period_end },
            cancelAtPeriodEnd: { set: subscription.cancel_at_period_end },
          },
          select: {
            status: true,
          },
        }),
        prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            subscriptionCheckedAt: now,
          },
        }),
      ]);

      if (!successStatuses.includes(updatedSubscription.status)) {
        throw redirect(configRoutes.auth.invalidSubscription);
      }

      return user;
    }

    if (!successStatuses.includes(user.subscription.status)) {
      throw redirect(configRoutes.auth.invalidSubscription);
    }

    return user;
  }

  throw await signOut(request);
}
