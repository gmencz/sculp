import type { LoaderArgs } from "@remix-run/server-runtime";
import { signOut } from "~/services/auth/api/sign-out";

export const loader = async ({ request }: LoaderArgs) => {
  return signOut(request);
};
