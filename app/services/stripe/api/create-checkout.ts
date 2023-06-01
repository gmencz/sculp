import { stripe } from "../config.server";
import { configRoutes } from "../../../config-routes";
import { env } from "~/utils/env";

export async function createStripeCheckoutSession(
  userId: string,
  userEmail: string,
  cancelUrl: string,
  customerId?: string
) {
  // If a user has a customer id, it means that they've already been part of the free trial
  // so they are not eligible for it again.
  const isEligibleForFreeTrial = !customerId;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    billing_address_collection: "auto",
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    customer_email: userEmail,
    mode: "subscription",
    success_url: `${env.HOST_URL}${configRoutes.auth.checkout}`,
    cancel_url: `${env.HOST_URL}${cancelUrl}`,
    subscription_data: {
      trial_period_days: isEligibleForFreeTrial ? 30 : undefined,
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
