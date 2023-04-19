import { parse } from "@conform-to/zod";
import { Prisma } from "@prisma/client";
import type { ActionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { z } from "zod";
import { createAccessRequest } from "~/models/access-request.server";

export const requestAccessSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email is not valid.",
      required_error: "Email is required.",
    })
    .min(1, "Email is required.")
    .max(254, "Email must be at most 254 characters long.")
    .email("Email is not valid."),

  currentLogbook: z
    .string({
      invalid_type_error: "Current logbook is not valid.",
    })
    .max(254, "Current logbook must be at most 254 characters long.")
    .optional(),
});

export type RequestAccessSchema = z.infer<typeof requestAccessSchema>;

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema: requestAccessSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  try {
    await createAccessRequest(
      submission.value.email,
      submission.value.currentLogbook || null
    );

    return json(submission);
  } catch (error) {
    console.error(error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === "P2002") {
        submission.error["email"] = "That email is already on our waitlist.";
        return json(submission, { status: 400 });
      }
    }

    submission.error["email"] =
      "Something went wrong requesting access, try again later.";

    return json(submission, { status: 500 });
  }
}
