import { ArrowLongRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  getCurrentMesocycle,
  getMesocyclesCount,
} from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);

  const [currentMesocycle, userMesocyclesCount] = await Promise.all([
    getCurrentMesocycle(user.id),
    getMesocyclesCount(user.id),
  ]);

  return json({
    currentMesocycle,
    userMesocyclesCount,
  });
};

export default function Today() {
  const { currentMesocycle, userMesocyclesCount } =
    useLoaderData<typeof loader>();

  return (
    <div className="py-10">
      {currentMesocycle ? (
        <div>
          <p>Your current mesocycle: {currentMesocycle.id}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900">
            Nothing today
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {userMesocyclesCount > 0
              ? "Get started by starting one of your mesocycles."
              : "Get started by planning a new mesocycle."}
          </p>
          <div className="mt-6">
            {userMesocyclesCount > 0 ? (
              <Link
                to="/app/mesocycles"
                className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Go to your mesocycles
                <ArrowLongRightIcon
                  className="-mr-0.5 ml-1.5 h-5 w-5"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <Link
                to="/app/new-mesocycle"
                className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlusIcon
                  className="-ml-0.5 mr-1.5 h-5 w-5"
                  aria-hidden="true"
                />
                New mesocycle
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
