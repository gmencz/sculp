import { stripe } from "../config.server";

export function getCheckoutSessionById(id: string) {
  return stripe.checkout.sessions.retrieve(id);
}
