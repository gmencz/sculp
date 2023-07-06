import type { LoaderArgs } from "@remix-run/server-runtime";
import { AppPageHeader } from "~/components/app-page-header";
import { requireUser } from "~/services/auth/api/require-user";
import { configRoutes } from "~/utils/routes";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

export default function NewRoutine() {
  return (
    <>
      <AppPageHeader goBackTo={configRoutes.app.home} pageTitle="New Routine" />
    </>
  );
}
