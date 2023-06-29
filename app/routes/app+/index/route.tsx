import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import type { MatchWithHeader } from "~/utils/hooks";

export const handle: MatchWithHeader = {
  header: () => "Home",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return json({});
};

export default function Home() {
  return (
    <AppPageLayout>
      <Card>
        <h3 className="mb-4 text-lg font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
          Home
        </h3>
      </Card>
    </AppPageLayout>
  );
}
