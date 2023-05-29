import {
  ArrowLongRightIcon,
  CalendarIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import type { CurrentMesocycleNotFoundData } from "./route";
import { Link } from "@remix-run/react";
import { configRoutes } from "~/config-routes";

type CurrentMesocycleNotFoundProps = {
  data: CurrentMesocycleNotFoundData;
};

export function CurrentMesocycleNotFound({
  data,
}: CurrentMesocycleNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center lg:py-10">
      <CalendarIcon className="mx-auto h-12 w-12 text-zinc-400" />
      <h3 className="mt-2 text-sm font-semibold text-zinc-900">Nothing here</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {data.mesocyclesCount > 0
          ? "Get started by starting one of your mesocycles."
          : "Get started by planning a new mesocycle."}
      </p>
      <div className="mt-6">
        {data.mesocyclesCount > 0 ? (
          <Link
            to={configRoutes.mesocycles.list}
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
            to={configRoutes.mesocycles.newStepOne}
            className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New mesocycle
          </Link>
        )}
      </div>
    </div>
  );
}
