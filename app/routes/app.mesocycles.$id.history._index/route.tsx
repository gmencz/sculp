import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import { AppPageLayout } from "~/components/app-page-layout";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { getMesocycleRunsById } from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await getMesocycleRunsById(id, user.id);
  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  return json({ mesocycle });
};

export default function MesocycleHistory() {
  const { mesocycle } = useLoaderData<typeof loader>();

  return (
    <AppPageLayout>
      <Heading>{mesocycle.name}</Heading>
      <Paragraph>
        {mesocycle.runs.length
          ? `You've done this mesocycle ${mesocycle.runs.length} ${
              mesocycle.runs.length === 1 ? "time" : "times"
            }.`
          : `You haven't done this mesocycle yet.`}
      </Paragraph>

      {mesocycle.runs.length ? (
        <table className="mt-4 min-w-full divide-y divide-zinc-300">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-4"
              >
                Start date
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
              >
                Finish date
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {mesocycle.runs.map((run) => (
              <tr key={run.id}>
                <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-zinc-900 sm:pl-4">
                  {format(new Date(run.startDate), "MMMM' 'd' 'yyyy")}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                  {format(new Date(run.endDate), "MMMM' 'd' 'yyyy")}
                </td>

                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                  <Link
                    to={`./${run.id}`}
                    className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-900"
                  >
                    <span className="hidden xs:inline">View training</span>
                    <ArrowLongRightIcon className="h-6 w-6" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </AppPageLayout>
  );
}
