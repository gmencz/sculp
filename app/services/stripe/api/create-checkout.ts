import { stripe } from "../config.server";
import { configRoutes } from "../../../config-routes";
import { env } from "~/utils/env";
import { generateId } from "~/utils";

export async function createStripeCheckoutSession(
  userId: string,
  userEmail: string
) {
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    customer_email: userEmail,
    mode: "subscription",
    success_url: `${env.HOST_URL}${configRoutes.auth.stripeCheckout}`,
    cancel_url: `${env.HOST_URL}${
      configRoutes.auth.getStarted
    }?canceled_id=${generateId()}`,
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        userId,
      },
    },
  });

  if (!session?.url) {
    throw new Error("Unable to create Stripe Checkout Session.");
  }

  return session.url;
}
