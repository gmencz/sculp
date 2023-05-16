import {
  ArrowLongRightIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { configRoutes } from "~/config-routes";
import { getMesocycles } from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const mesocycles = await getMesocycles(user.id);
  return json({ mesocycles });
};

export default function Mesocycles() {
  const { mesocycles } = useLoaderData<typeof loader>();

  if (!mesocycles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <svg
          className="mx-auto h-12 w-12 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-zinc-900">
          Nothing here yet
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Get started by planning a new mesocycle.
        </p>
        <div className="mt-6">
          <Link
            to={configRoutes.newMesocycle}
            className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New mesocycle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading>Mesocycles</Heading>
          <Paragraph>A list of all your mesocycles.</Paragraph>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to={configRoutes.newMesocycle}
            className="block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            New mesocycle
          </Link>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  {mesocycle.durationInWeeks} weeks
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center text-sm text-zinc-500">
                  <CalendarIcon
                    className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
                    aria-hidden="true"
                  />
                  {mesocycle._count.trainingDays} days per week
                </div>
                <div className="flex items-center text-sm text-zinc-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
                    fill="currentColor"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
                  </svg>
                  {mesocycle.goal}
                </div>
              </div>
            </div>

            <div>
              <div className="-mt-px flex divide-x divide-zinc-200">
                <div className="flex w-0 flex-1">
                  <Link
                    to={`./${mesocycle.id}/start`}
                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent bg-orange-100 py-4 text-sm font-semibold text-orange-700"
                  >
                    Start
                    <ArrowLongRightIcon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <Link
                    to={`./${mesocycle.id}`}
                    className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-zinc-900"
                  >
                    <PencilSquareIcon
                      className="h-5 w-5 text-zinc-400"
                      aria-hidden="true"
                    />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
