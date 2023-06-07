import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, Link, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { z } from "zod";
import { ErrorMessage } from "~/components/error-message";
import { Input } from "~/components/input";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/utils/routes";
import { verifyLogin } from "~/services/auth/api/verify-login";
import { createStripeCheckoutSession } from "~/services/stripe/api/create-checkout";
import { signIn } from "~/services/auth/api/sign-in";
import { sessionStorage } from "~/utils/session.server";
import { emailSchema, passwordSchema } from "~/utils/schemas";
import { rateLimit } from "~/services/redis/api/rate-limit";
import { addHours } from "date-fns";
import type { V2_MetaFunction } from "@remix-run/node";
import { getMeta } from "~/utils/seo";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

type Schema = z.infer<typeof schema>;

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  // Max 10 requests per hour.
  await rateLimit(request, { max: 10, windowInSeconds: 60 * 60 });

  const user = await verifyLogin(
    submission.value.email,
    submission.value.password
  );

  if (!user) {
    submission.error["form"] = "You have entered an invalid email or password.";
    return json(submission, { status: 400 });
  }

  // If the user hasn't set up their subscription yet, redirect them to the stripe checkout page.
  if (!user.subscription) {
    const sessionUrl = await createStripeCheckoutSession(
      user.id,
      user.email,
      configRoutes.auth.signIn,
      user.stripeCustomerId ?? undefined,
      addHours(new Date(), 1)
    );

    return redirect(sessionUrl, { status: 303 });
  }

  const userSession = await signIn({
    request,
    userId: user.id,
  });

  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirect_to");
  if (redirectTo) {
    redirectTo = decodeURIComponent(redirectTo);
  } else {
    redirectTo = configRoutes.app.current;
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(userSession),
    },
  });
}

export const meta: V2_MetaFunction = () => getMeta("Sculped - Sign In");

export default function SignIn() {
  const lastSubmission = useActionData() as any;
  const [form, { email, password }] = useForm<Schema>({
    id: "sign-in",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <Link to={configRoutes.home}>
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt="Sculped" />
        </Link>
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900">
          Sign in to your account
        </h2>
        <Form method="POST" {...form.props}>
          <div className="relative mb-2 -space-y-px rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-zinc-300" />

            <Input
              config={email}
              hideLabel
              autoComplete="email"
              type="email"
              label="Email"
              hideErrorMessage
              placeholder="Email"
              className="relative rounded-b-none ring-1 ring-inset ring-zinc-100 focus:z-10 sm:leading-6"
            />

            <Input
              config={password}
              hideLabel
              type="password"
              label="Password"
              hideErrorMessage
              placeholder="Password"
              className="relative rounded-t-none ring-1 ring-inset ring-zinc-100 focus:z-10 sm:leading-6"
            />
          </div>

          {email.error || password.error ? (
            <ul className="flex flex-col">
              {email.error ? (
                <li>
                  <ErrorMessage>{email.error}</ErrorMessage>
                </li>
              ) : null}

              {password.error ? (
                <li>
                  <ErrorMessage>{password.error}</ErrorMessage>
                </li>
              ) : null}
            </ul>
          ) : null}

          {lastSubmission?.error.form ? (
            <p className="mt-4 text-sm text-red-500" role="alert">
              {lastSubmission?.error.form}
            </p>
          ) : null}

          <div className="my-6 flex items-center justify-between">
            <div className="text-sm leading-6">
              <Link
                to={configRoutes.auth.forgotPassword}
                className="font-semibold text-orange-600 hover:text-orange-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <SubmitButton
            text="Sign in"
            className="flex w-full items-center justify-center gap-1"
          />
        </Form>

        <p className="text-center text-sm leading-6 text-zinc-500">
          Not a member?{" "}
          <Link
            to={configRoutes.auth.getStarted}
            className="font-semibold text-orange-600 hover:text-orange-500"
          >
            Start a 30-day free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
