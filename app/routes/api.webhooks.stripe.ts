import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type Stripe from "stripe";
import { prisma } from "~/db.server";
import { stripe } from "~/services/stripe/config.server";
import { env } from "~/utils/env";

/**
 * Gets Stripe event signature from request header.
 */
async function getStripeEvent(request: Request) {
  try {
    // Get header Stripe signature.
    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing Stripe signature.");

    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    return event;
  } catch (err: unknown) {
    console.log(err);
    return json({}, { status: 400 });
  }
}

export async function action({ request }: ActionArgs) {
  const event = await getStripeEvent(request);

  try {
    switch (event.type) {
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.delete({ where: { id: subscription.id } });

        return json({}, { status: 200 });
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata;
        if (!userId) {
          throw new Error("Missing userId in metadata.");
        }

        await prisma.user.update({
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

        return json({}, { status: 200 });
      }

      case "customer.subscription.trial_will_end":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: subscription.customer.toString() },
          select: {
            id: true,
            subscription: {
              select: {
                status: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error(
            `User with customer id ${subscription.customer} not found.`
          );
        }

        await prisma.subscription.update({
          where: {
            userId: user.id,
          },
          data: {
            status: { set: subscription.status },
            currentPeriodStart: { set: subscription.current_period_start },
            currentPeriodEnd: { set: subscription.current_period_end },
            cancelAtPeriodEnd: { set: subscription.cancel_at_period_end },
          },
        });

        return json({}, { status: 200 });
      }
    }
  } catch (err: unknown) {
    console.error(err);
    return json({}, { status: 400 });
  }

  // We'll return a 200 status code for all other events.
  // A `501 Not Implemented` or any other status code could be returned.
  return json({}, { status: 200 });
}
