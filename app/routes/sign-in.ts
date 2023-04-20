import { parse } from "@conform-to/zod";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { z } from "zod";
import { verifyLogin } from "~/models/user.server";

export const signInSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email is not valid.",
      required_error: "Email is required.",
    })
    .min(1, "Email is required.")
    .max(254, "Email must be at most 254 characters long.")
    .email("Email is not valid."),

  password: z
    .string({
      invalid_type_error: "Password is not valid.",
      required_error: "Password is required.",
    })
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password must be at most 128 characters long."),
});

export type SignInSchema = z.infer<typeof signInSchema>;

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema: signInSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const user = await verifyLogin(
    submission.value.email,
    submission.value.password
  );

  if (!user) {
    submission.error["form"] = "You have entered an invalid email or password.";
    return json(submission);
  }

  return redirect("/app");
}
