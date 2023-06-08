import {
  PencilSquareIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/20/solid";
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
          <Heading className="hidden lg:block">Mesocycles</Heading>
          {mesocycles.length > 0 ? (
            <Paragraph className="mt-1 hidden lg:block">
              A list of all your mesocycles.
            </Paragraph>
          ) : null}
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

      {mesocycles.length === 0 ? (
        <h3 className="mb-4 mt-2 block text-sm font-semibold text-zinc-900 lg:hidden">
          Nothing here yet
        </h3>
      ) : null}

      <ul className="flex flex-col gap-6 lg:mt-4">
        {mesocycles.map((mesocycle) => (
          <li
            key={mesocycle.id}
            className="col-span-1 divide-y divide-zinc-200 rounded-lg bg-white shadow"
          >
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <h3 className="truncate text-sm font-medium text-zinc-900">
                  {mesocycle.name}
                </h3>
                <span className="inline-flex flex-shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                  {mesocycle.microcycles}{" "}
                  {mesocycle.microcycles === 1 ? "microcycle" : "microcycles"}
                </span>
                {currentMesocycle?.mesocycle &&
                mesocycle.id === currentMesocycle.mesocycle.id ? (
                  <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-orange-600/20">
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
            </div>

            <div>
              <div className="-mt-px flex divide-x divide-zinc-200">
                <div className="flex w-0 flex-1">
                  {currentMesocycle?.mesocycle &&
                  mesocycle.id === currentMesocycle.mesocycle.id ? (
                    <Link
                      to={`./${mesocycle.id}/stop`}
                      className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent bg-red-100 py-4 text-sm font-semibold text-red-700 hover:bg-red-200"
                    >
                      <span className="hidden xs:block">Stop</span>
                      <StopIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      to={`./${mesocycle.id}/start`}
                      className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent bg-orange-100 py-4 text-sm font-semibold text-orange-700 hover:bg-orange-200"
                    >
                      <span className="hidden xs:block">Start</span>
                      <PlayIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <Link
                    to={`./${mesocycle.id}`}
                    className="group relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    <PencilSquareIcon
                      className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700"
                      aria-hidden="true"
                    />
                    <span className="hidden xs:block">Edit</span>
                  </Link>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <Link
                    to={`./${mesocycle.id}/history`}
                    className="group relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700"
                    >
                      <path d="M24 12c0 6.627-5.373 12-12 12s-12-5.373-12-12h2c0 5.514 4.486 10 10 10s10-4.486 10-10-4.486-10-10-10c-2.777 0-5.287 1.141-7.099 2.977l2.061 2.061-6.962 1.354 1.305-7.013 2.179 2.18c2.172-2.196 5.182-3.559 8.516-3.559 6.627 0 12 5.373 12 12zm-13-6v8h7v-2h-5v-6h-2z" />
                    </svg>
                    <span className="hidden xs:block">History</span>
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AppPageLayout>
  );
}
