import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs, SerializeFrom } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import clsx from "clsx";
import { format } from "date-fns";
import { AppPageLayout } from "~/components/app-page-layout";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import { classes } from "~/utils/classes";
import type { MatchWithHeader } from "~/utils/hooks";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => `${data.mesocycle.name} history`,
  links: [],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await prisma.mesocycle.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      name: true,
      runs: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
        orderBy: {
          startDate: "desc",
        },
      },
    },
  });

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
      <div className="hidden lg:block">
        <Heading className="text-zinc-900">{mesocycle.name}</Heading>
        <Paragraph className="mt-1">A history of this mesocycle.</Paragraph>
      </div>

      {mesocycle.runs.length ? (
        <table className="min-w-full divide-y divide-zinc-300 lg:mt-6">
          <thead>
            <tr>
              <th
                scope="col"
                className="pb-3.5 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-4"
              >
                Start date
              </th>
              <th
                scope="col"
                className="px-3 pb-3.5 text-left text-sm font-semibold text-zinc-900"
              >
                Finish date
              </th>
              <th scope="col" className="relative pb-3.5 pl-3 pr-4 sm:pr-0">
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
                    className={clsx(
                      classes.buttonOrLink.textOnly,
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    <span className="hidden xs:inline">View training</span>
                    <ArrowLongRightIcon className="h-6 w-6" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <h3 className="mt-2 text-sm font-semibold text-zinc-900">
          Nothing here yet
        </h3>
      )}
    </AppPageLayout>
  );
}
