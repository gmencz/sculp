import { Link, useLoaderData, useSubmit } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { useState } from "react";
import { BackLink } from "~/components/back-link";
import { Spinner } from "~/components/spinner";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { getCheckoutSessionById } from "~/services/stripe/api/get-checkout-session-by-id";
import { useInterval } from "~/utils/hooks";
import { signIn } from "~/services/auth/api/sign-in";
import { sessionStorage } from "~/utils/session.server";
import { classes } from "~/utils/classes";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return redirect(configRoutes.home);
  }

  const session = await getCheckoutSessionById(sessionId);
  if (!session.customer) {
    throw new Error("Missing customer in stripe checkout session.");
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: session.customer.toString() },
    select: {
      id: true,
      subscription: {
        select: {
          status: true,
        },
      },
    },
  });

  const successStatuses = ["trialing", "active"];
  if (
    user?.subscription &&
    successStatuses.includes(user.subscription.status)
  ) {
    const userSession = await signIn({ request, userId: user.id });

    return json(
      {
        sessionId,
        pending: false,
      },
      {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(userSession),
        },
      }
    );
  }

  return json({
    sessionId,
    pending: true,
  });
};

export default function Checkout() {
  const { pending, sessionId } = useLoaderData<typeof loader>();
  const [retries, setRetries] = useState(0);
  const submit = useSubmit();

  // Re-fetch subscription status every 'x' seconds.
  useInterval(
    () => {
      submit({ session_id: sessionId });
      setRetries(retries + 1);
    },
    pending && retries !== 3 ? 2_000 : null
  );

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

      {/* Pending Message. */}
      {pending && retries < 3 && (
        <>
          <Spinner className="h-10 w-10 text-orange-500" />

          <h3 className="mb-3 mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Completing your checkout...
          </h3>

          <p className="max-w-md text-center font-medium text-zinc-500 dark:text-zinc-300">
            This will take a few seconds.
          </p>
        </>
      )}

      {/* Success Message. */}
      {!pending && (
        <>
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt="Sculped" />

          <div className="my-4" />

          <h3 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Checkout completed!
          </h3>

          <p className="mb-6 max-w-md text-center text-base font-medium text-zinc-500 dark:text-zinc-300">
            You're now one step closer to unlocking your ultimate
            muscle-building journey. Prepare to push boundaries, break records,
            and achieve your dream physique. Thank you for choosing our app, and
            we can't wait to witness your remarkable progress.
          </p>

          <Link
            prefetch="intent"
            to={configRoutes.app.home}
            className={classes.buttonOrLink.primary}
          >
            Continue to App
            <ArrowLongRightIcon className="h-4 w-4 text-white" />
          </Link>
        </>
      )}

      {/* Error Message. */}
      {pending && retries === 3 && (
        <>
          <img
            src="/melt.png"
            alt=""
            className="h-36 w-36 select-none transition hover:scale-105 hover:brightness-110"
          />

          <h3 className="mb-3 mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Oops!
          </h3>
          <p className="max-w-md text-center font-medium text-zinc-500">
            Something went wrong. Please contact us directly at{" "}
            <a
              href="mailto:hello@sculped.app"
              className="text-orange-500 hover:text-orange-600"
            >
              hello@sculped.app
            </a>{" "}
            and we will solve it for you.
          </p>
          <div className="my-3" />

          <BackLink to={configRoutes.home}>Go back home</BackLink>
        </>
      )}
    </div>
  );
}
