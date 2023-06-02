import { env } from "~/utils/env.server";
import { resend } from "../config.server";
import { PasswordResetEmailTemplate } from "../templates/password-reset";

export function sendPasswordResetEmail(email: string) {
  return resend.emails.send({
    from: env.RESEND_NO_REPLY_EMAIL_SENDER,
    to: email,
    subject: "Sculped - Password reset",
    react: PasswordResetEmailTemplate(),
  });
}
