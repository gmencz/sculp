import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Prisma } from "@prisma/client";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { ErrorMessage } from "~/components/error-message";
import { ErrorToast } from "~/components/error-toast";
import { Input } from "~/components/input";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { createStripeCheckoutSession } from "~/services/stripe/api/create-checkout";
import { hashPassword } from "~/utils/encryption.server";
import { generateId } from "~/utils/ids";
import { useAfterPaintEffect } from "~/utils/hooks";
import { emailSchema, passwordSchema } from "~/utils/schemas";

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

  const { email, password } = submission.value;

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
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

    const sessionUrl = await createStripeCheckoutSession(
      newUser.id,
      newUser.email,
      configRoutes.auth.getStarted + `?canceled_id=${generateId()}`
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

export default function GetStarted() {
  const lastSubmission = useActionData();
  const [form, { email, password, confirmedPassword }] = useForm<Schema>({
    id: "get-started",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const [searchParams] = useSearchParams();
  const canceledId = searchParams.get("canceled_id");
  useAfterPaintEffect(() => {
    if (canceledId) {
      toast.custom(
        (t) => (
          <ErrorToast
            t={t}
            title="Free trial canceled"
            description="Your free trial registration has been canceled."
          />
        ),
        { duration: 5000, position: "top-center", id: canceledId }
      );
    }
  }, [canceledId]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <Link to="/">
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt="Sculped" />
        </Link>
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900">
          Start your 30-day free trial
        </h2>
        <Paragraph className="mt-2 text-center">
          Take your hypertrophy training to the next level for free the first
          month and then 4.99$/mo.
        </Paragraph>
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
