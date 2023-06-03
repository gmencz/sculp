import { env } from "~/utils/env.server";
import { resend } from "../config.server";
import { PasswordResetEmailTemplate } from "../templates/password-reset";
import { jwt } from "~/utils/jwt.server";
import { configRoutes } from "~/utils/routes";

export async function sendPasswordResetEmail(email: string) {
  const token = await new Promise<string | undefined>((res, rej) =>
    jwt.sign(
      { email },
      env.PASSWORD_RESET_JWT_SECRET,
      {
        expiresIn: "1h",
      },
      (error, encoded) => {
        if (error) rej(error);
        res(encoded);
      }
    )
  );

  if (!token) {
    throw new Error(
      `sendPasswordResetEmail: token is null, this should never happen.`
    );
  }

  const link = `${env.HOST_URL}${configRoutes.auth.resetPassword}?token=${token}`;

  return resend.emails.send({
    from: env.RESEND_NO_REPLY_EMAIL_SENDER,
    to: email,
    subject: "Sculped - Password reset",
    react: PasswordResetEmailTemplate({ link }),
  });
}
