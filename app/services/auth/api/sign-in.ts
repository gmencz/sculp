import { getSessionFromCookie } from "../../../utils/session.server";

export async function signIn({
  request,
  userId,
}: {
  request: Request;
  userId: string;
}) {
  const session = await getSessionFromCookie(request);
  session.set("userId", userId);
  return session;
}
