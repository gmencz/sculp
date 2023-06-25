import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { AppPageLayout } from "~/components/app-page-layout";
import { MesocycleOverview } from "~/components/mesocycle-overview";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import type { MatchWithHeader } from "~/utils/hooks";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import clsx from "clsx";
import { classes } from "~/utils/classes";

export const handle: MatchWithHeader = {
  header: () => "Mesocycles",
  links: [
    {
      type: "new",
      label: "New mesocycle",
      to: configRoutes.app.mesocycles.new.step1,
    },
  ],
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const mesocycles = await prisma.mesocycle.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      goal: true,
      microcycles: true,
      restDays: true,
      _count: { select: { trainingDays: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: { id: true, mesocycle: { select: { id: true } } },
  });

  return json({ mesocycles, currentMesocycle });
};

export default function Mesocycles() {
  const { mesocycles, currentMesocycle } = useLoaderData<typeof loader>();

  return (
    <AppPageLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading className="hidden text-zinc-900 dark:text-zinc-50 lg:block">
            Mesocycles
          </Heading>
          {mesocycles.length > 0 ? (
            <Paragraph className="mt-1 hidden lg:block">
              A list of all your mesocycles.
            </Paragraph>
          ) : (
            <Paragraph className="lg:mt-1">Nothing here yet.</Paragraph>
          )}
        </div>
        <div className="mb-6 mt-4 hidden sm:mb-0 sm:ml-16 sm:mt-0 sm:flex-none lg:block">
          <Link
            to={configRoutes.app.mesocycles.new.step1}
            className={clsx(classes.buttonOrLink.primary, "block w-full")}
          >
            New mesocycle
          </Link>
        </div>
      </div>

      <ul className="flex flex-col gap-6 lg:mt-4">
        {mesocycles.map((mesocycle) => (
          <li
            key={mesocycle.id}
            className="col-span-1 divide-y divide-zinc-200 rounded-lg border border-zinc-300 bg-zinc-50 hover:bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-950"
          >
            <Link to={`./${mesocycle.id}`} className="block px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                  {mesocycle.name}
                </h3>
                {currentMesocycle?.mesocycle &&
                mesocycle.id === currentMesocycle.mesocycle.id ? (
                  <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-orange-600/20 dark:bg-green-900 dark:text-green-200 hover:dark:bg-green-950">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="mt-2">
                <MesocycleOverview
                  goal={mesocycle.goal}
                  microcycles={mesocycle.microcycles}
                  restDays={mesocycle.restDays.length}
                  trainingDays={mesocycle._count.trainingDays}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AppPageLayout>
  );
}
