import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { BackLink } from "~/components/back-link";
import { configRoutes } from "~/utils/routes";
import { env } from "~/utils/env.server";
import { requireUser } from "~/services/auth/api/require-user";
import { signOut } from "~/services/auth/api/sign-out";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request, { ignoreSubscription: true });
  if (!user.subscription) {
    throw await signOut(request);
  }

  const customerPortalLink =
    env.STRIPE_CUSTOMER_PORTAL_LINK +
    `?prefilled_email=${encodeURIComponent(user.email)}`;

  return json({
    subscription: user.subscription,
    customerPortalLink,
  });
};

export default function SubscriptionError() {
  const { subscription, customerPortalLink } = useLoaderData<typeof loader>();

  return (
    <div className="relative isolate m-auto flex h-full max-w-lg flex-col items-center justify-center px-6">
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#fcc189] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <img
        src="/melt.png"
        alt=""
        className="h-36 w-36 select-none transition hover:scale-105 hover:brightness-110"
      />

      <h3 className="mb-3 mt-6 text-3xl font-bold text-zinc-950">Oops!</h3>
      <p className="max-w-md text-center font-medium text-zinc-500">
        Something went wrong with your subscription, its status is{" "}
        <strong>{subscription.status}</strong>. You can manage it{" "}
        <a
          href={customerPortalLink}
          className="text-orange-500 hover:text-orange-600"
        >
          here
        </a>{" "}
        and below or reach out to us at{" "}
        <a
          href="mailto:hello@sculped.app"
          className="text-orange-500 hover:text-orange-600"
        >
          hello@sculped.app
        </a>{" "}
        if you need further assistance.
      </p>
      <div className="my-3" />

      <a
        href={customerPortalLink}
        className="mb-6 rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
      >
        Manage subscription
      </a>

      <BackLink to={configRoutes.auth.signOut}>Go back home</BackLink>
    </div>
  );
}
