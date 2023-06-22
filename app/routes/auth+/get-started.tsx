import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Prisma } from "@prisma/client";
import { Form, Link, useActionData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { z } from "zod";
import { ErrorMessage } from "~/components/error-message";
import { Input } from "~/components/input";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { createStripeCheckoutSession } from "~/services/stripe/api/create-checkout";
import { hashPassword } from "~/utils/encryption.server";
import { emailSchema, idSchema, passwordSchema } from "~/utils/schemas";
import { rateLimit } from "~/services/redis/api/rate-limit";
import { jwt } from "~/utils/jwt.server";
import { env } from "~/utils/env.server";
import { addHours } from "date-fns";

const schema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmedPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmedPassword, {
    message: "Passwords don't match.",
    path: ["confirmedPassword"],
  });

type Schema = z.infer<typeof schema>;

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  // Max 5 requests per hour. This is generous enough.
  await rateLimit(request, { max: 5, windowInSeconds: 60 * 60 });

  const { email, password } = submission.value;

  try {
    // Create temporary user.
    const newUser = await prisma.user.create({
      data: {
        email,
        role: "USER",
        password: {
          create: {
            hash: await hashPassword(password),
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const cancelToken = await new Promise<string | undefined>((res, rej) =>
      jwt.sign(
        { userId: newUser.id },
        env.STRIPE_CHECKOUT_JWT_SECRET,
        {
          expiresIn: "1h",
        },
        (error, encoded) => {
          if (error) rej(error);
          res(encoded);
        }
      )
    );

    const sessionUrl = await createStripeCheckoutSession(
      newUser.id,
      newUser.email,
      configRoutes.auth.getStarted + `?cancel_token=${cancelToken}`,
      undefined,
      addHours(new Date(), 1)
    );

    return redirect(sessionUrl, { status: 303 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        submission.error["form"] =
          "That email is already registered, please sign in instead.";

        return json(submission, { status: 400 });
      }
    }
    throw e;
  }
};

const payloadSchema = z.object({
  userId: idSchema,
});

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const cancelToken = url.searchParams.get("cancel_token");
  if (!cancelToken) {
    return json({});
  }

  const payload = await new Promise((res, rej) => {
    jwt.verify(
      cancelToken,
      env.STRIPE_CHECKOUT_JWT_SECRET,
      (error, decoded) => {
        if (error) rej(error);
        res(decoded);
      }
    );
  });

  // Delete the temporary user that was created during the checkout because the checkout was canceled.
  const { userId } = payloadSchema.parse(payload);

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return json({});
};

export default function GetStarted() {
  const lastSubmission = useActionData() as any;
  const [form, { email, password, confirmedPassword }] = useForm<Schema>({
    id: "get-started",
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
        <div>
          <h2 className=" text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900">
            Start your 14-day free trial
          </h2>
          <Paragraph className="mt-2 text-center">
            Take your hypertrophy training to the next level for free the first
            month and then 4.99$/mo.
          </Paragraph>
        </div>
        <Form method="POST" {...form.props}>
          <div className="relative mb-2 -space-y-px rounded-md ">
            <div className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-zinc-300" />

            <Input
              config={email}
              hideLabel
              autoComplete="email"
              type="email"
              label="Email"
              hideErrorMessage
              placeholder="Email"
              className="relative rounded-b-none focus:z-10 sm:leading-6"
            />

            <Input
              config={password}
              hideLabel
              type="password"
              label="Password"
              hideErrorMessage
              placeholder="Password"
              className="relative rounded-none focus:z-10 sm:leading-6"
            />

            <Input
              config={confirmedPassword}
              hideLabel
              type="password"
              label="Confirm password"
              hideErrorMessage
              placeholder="Confirm password"
              className="relative rounded-t-none focus:z-10 sm:leading-6"
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

              {confirmedPassword.error ? (
                <li>
                  <ErrorMessage>{confirmedPassword.error}</ErrorMessage>
                </li>
              ) : null}
            </ul>
          ) : null}

          {lastSubmission?.error.form ? (
            <p className="mt-4 text-sm text-red-500" role="alert">
              {lastSubmission?.error.form}
            </p>
          ) : null}

          <div className="mt-6">
            <SubmitButton className="w-full" text="Start free trial" />
          </div>
        </Form>

        <p className="text-center text-sm leading-6 text-zinc-500">
          Already have an account?{" "}
          <Link
            to={configRoutes.auth.signIn}
            className="font-semibold text-orange-600 hover:text-orange-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
