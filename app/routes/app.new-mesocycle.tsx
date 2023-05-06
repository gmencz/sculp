import type { LoaderArgs } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

export default function NewMesocycle() {
  return <p>New mesocycle</p>;
}
