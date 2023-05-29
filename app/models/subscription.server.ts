import type Stripe from "stripe";
import { prisma } from "~/db.server";

export async function deleteSubscriptionById(id: string) {
  return prisma.subscription.delete({ where: { id } });
}

export async function updateSubscriptionByUserId(
  userId: string,
  subscription: Stripe.Subscription
) {
  await prisma.subscription.update({
    where: {
      userId,
    },
    data: {
      status: { set: subscription.status },
      currentPeriodStart: { set: subscription.current_period_start },
      currentPeriodEnd: { set: subscription.current_period_end },
      cancelAtPeriodEnd: { set: subscription.cancel_at_period_end },
    },
  });
}

export async function createSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: { set: subscription.customer.toString() },
      subscription: {
        create: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      },
    },
  });
}
