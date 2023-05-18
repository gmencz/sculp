import { parse } from "@conform-to/zod";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { z } from "zod";
import { configRoutes } from "~/config-routes";
import { sendPasswordResetEmail } from "~/models/user.server";
import { generateId } from "~/utils";

export const forgotPasswordSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email is not valid.",
      required_error: "Email is required.",
    })
    .min(1, "Email is required.")
    .max(254, "Email must be at most 254 characters long.")
    .email("Email is not valid."),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema: forgotPasswordSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  await sendPasswordResetEmail(submission.value.email);

  return json(submission);
}
