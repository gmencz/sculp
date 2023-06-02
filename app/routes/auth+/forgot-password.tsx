import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Input } from "~/components/input";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { SuccessToast } from "~/components/success-toast";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { sendPasswordResetEmail } from "~/services/resend/api/send-password-reset-email";
import { generateId } from "~/utils/ids";
import { useAfterPaintEffect } from "~/utils/hooks";

const schema = z.object({
  email: z
    .string({
      invalid_type_error: "Email is not valid.",
      required_error: "Email is required.",
    })
    .min(1, "Email is required.")
    .max(254, "Email must be at most 254 characters long.")
    .email("Email is not valid."),
});

type Schema = z.infer<typeof schema>;

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { email } = submission.value;
  const url = new URL(request.url);
  url.searchParams.set("sent_to_email", email);
  url.searchParams.set("success_id", generateId());

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: { id: true },
  });

  if (!user) {
    return redirect(configRoutes.auth.forgotPassword + url.search);
  }

  try {
    await sendPasswordResetEmail(email);
  } catch (error) {
    console.error(error);
  }

  return redirect(configRoutes.auth.forgotPassword + url.search);
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

  const [searchParams] = useSearchParams();
  const sentToEmail = searchParams.get("sent_to_email");
  const successId = searchParams.get("success_id");
  useAfterPaintEffect(() => {
    if (sentToEmail && successId) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success!"
            description={`We've sent you an email with a link to reset your password at ${sentToEmail}.`}
          />
        ),
        { duration: 5000, position: "top-center", id: successId }
      );
    }
  }, [sentToEmail, successId]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <Link to="/">
          <img className="mx-auto h-16 w-auto" src="/logo.png" alt="Sculped" />
        </Link>
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
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
