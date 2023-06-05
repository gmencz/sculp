import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, Link, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { z } from "zod";
import { Input } from "~/components/input";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { sendPasswordResetEmail } from "~/services/resend/api/send-password-reset-email";
import { emailSchema } from "~/utils/schemas";
import { rateLimit } from "~/services/redis/api/rate-limit";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";

const schema = z.object({
  email: emailSchema,
});

type Schema = z.infer<typeof schema>;

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  // Max 3 requests per hour. This is generous enough.
  await rateLimit(request, { max: 3, windowInSeconds: 60 * 60 });

  const { email } = submission.value;

  const updatedSession = await flashGlobalNotification(request, {
    type: "success",
    message: `We've sent you an email with a link to reset your password at ${email}.`,
  });

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: { id: true },
  });

  if (!user) {
    return redirect(configRoutes.auth.forgotPassword, {
      headers: {
        "Set-Cookie": await commitSession(updatedSession),
      },
    });
  }

  try {
    await sendPasswordResetEmail(email);
  } catch (error) {
    console.error(error);
  }

  return redirect(configRoutes.auth.forgotPassword, {
    headers: {
      "Set-Cookie": await commitSession(updatedSession),
    },
  });
};

export default function ForgotPassword() {
  const lastSubmission = useActionData();
  const [form, { email }] = useForm<Schema>({
    id: "forgot-password",
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
          Forgot your password or simply want to update it for any reason? Enter
          your email below and we'll send you a link to reset it.
        </Paragraph>

        <Form method="POST" className="mt-6" {...form.props}>
          <Input
            config={email}
            autoComplete="email"
            type="email"
            label="Email"
            hideLabel
            placeholder="you@example.com"
          />

          {lastSubmission?.error.form ? (
            <p className="mt-4 text-sm text-red-500" role="alert">
              {lastSubmission?.error.form}
            </p>
          ) : null}

          <SubmitButton text="Reset password" className="mt-6 w-full" />
        </Form>
      </div>
    </div>
  );
}
