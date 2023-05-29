import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type Stripe from "stripe";
import { prisma } from "~/db.server";
import { createUserSubscription } from "~/models/user.server";
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
      // case "customer.subscription.trial_will_end":
      //   subscription = event.data.object;
      //   status = subscription.status;
      //   console.log(`Subscription status is ${status}.`);
      //   // Then define and call a method to handle the subscription trial ending.
      //   // handleSubscriptionTrialEnding(subscription);
      //   break;

      // case "customer.subscription.deleted":
      //   subscription = event.data.object;
      //   status = subscription.status;
      //   console.log(`Subscription status is ${status}.`);
      //   // Then define and call a method to handle the subscription deleted.
      //   // handleSubscriptionDeleted(subscriptionDeleted);
      //   break;

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata;
        if (!userId) {
          throw new Error("Missing userId in metadata.");
        }

        await createUserSubscription(userId, subscription);

        return json({}, { status: 200 });
      }

      // case "customer.subscription.updated":
      //   subscription = event.data.object;
      //   status = subscription.status;
      //   console.log(`Subscription status is ${status}.`);
      //   // Then define and call a method to handle the subscription update.
      //   // handleSubscriptionUpdated(subscription);
      //   break;
    }
  } catch (err: unknown) {
    console.error(err);
    return json({}, { status: 400 });
  }

  // We'll return a 200 status code for all other events.
  // A `501 Not Implemented` or any other status code could be returned.
  return json({}, { status: 200 });
}
