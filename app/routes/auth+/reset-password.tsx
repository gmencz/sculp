import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, Link, useActionData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { z } from "zod";
import { ErrorMessage } from "~/components/error-message";
import { Input } from "~/components/input";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { prisma } from "~/utils/db.server";
import { hashPassword } from "~/utils/encryption.server";
import { env } from "~/utils/env.server";
import { jwt } from "~/utils/jwt.server";
import { configRoutes } from "~/utils/routes";
import { emailSchema, passwordSchema } from "~/utils/schemas";

const payloadSchema = z.object({
  email: emailSchema,
});

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return redirect(configRoutes.home);
  }

  try {
    const payload = await new Promise((res, rej) => {
      jwt.verify(token, env.PASSWORD_RESET_JWT_SECRET, (error, decoded) => {
        if (error) rej(error);
        res(decoded);
      });
    });

    const { email } = payloadSchema.parse(payload);
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return redirect(configRoutes.home);
    }

    return null;
  } catch (error) {
    return redirect(configRoutes.home);
  }
};

const schema = z
  .object({
    password: passwordSchema,
    confirmedPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmedPassword, {
    message: "Passwords don't match.",
    path: ["confirmedPassword"],
  });

type Schema = z.infer<typeof schema>;

export const action = async ({ request }: ActionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return redirect(configRoutes.home);
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { password } = submission.value;

  const payload = await new Promise((res, rej) => {
    jwt.verify(token, env.PASSWORD_RESET_JWT_SECRET, (error, decoded) => {
      if (error) rej(error);
      res(decoded);
    });
  });

  const { email } = payloadSchema.parse(payload);

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      password: {
        select: {
          hash: true,
        },
      },
    },
  });

  if (!user) {
    submission.error["form"] =
      "The link is not valid, please request a new one.";

    return json(submission, { status: 400 });
  }

  const newPasswordHash = await hashPassword(password);
  if (user.password?.hash === newPasswordHash) {
    submission.error["form"] =
      "Your new password can't be the same as your current one.";

    return json(submission, { status: 400 });
  }

  await prisma.password.update({
    where: {
      userId: user.id,
    },
    data: {
      hash: newPasswordHash,
    },
    select: {
      userId: true,
    },
  });

  return redirect(configRoutes.auth.signIn);
};

export default function ResetPassword() {
  const lastSubmission = useActionData();
  const [form, { password, confirmedPassword }] = useForm<Schema>({
    id: "reset-password",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <Link to="/">
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt="Sculped" />
        </Link>
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-900">
          Reset your password
        </h2>
        <Paragraph className="mt-2 text-center">
          Choose a new password below. You'll be redirected to sign in after
          resetting it.
        </Paragraph>

        <Form method="POST" className="mt-6" {...form.props}>
          <div className="relative mb-2 -space-y-px rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-zinc-300" />

            <Input
              config={password}
              hideLabel
              type="password"
              label="New password"
              hideErrorMessage
              placeholder="New password"
              className="relative rounded-b-none ring-1 ring-inset ring-zinc-100 focus:z-10 sm:leading-6"
            />

            <Input
              config={confirmedPassword}
              hideLabel
              type="password"
              label="Confirm new password"
              hideErrorMessage
              placeholder="Confirm new password"
              className="relative rounded-t-none ring-1 ring-inset ring-zinc-100 focus:z-10 sm:leading-6"
            />
          </div>

          {confirmedPassword.error || password.error ? (
            <ul className="flex flex-col">
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

          <SubmitButton text="Reset" className="mt-4 w-full" />
        </Form>
      </div>
    </div>
  );
}
