import clsx from "clsx";
import type { CurrentMesocycleState, loader } from "../route";
import {
  ArrowLongRightIcon,
  ArrowPathRoundedSquareIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/20/solid";
import { Transition } from "@headlessui/react";
import type { Set } from "./training-day-exercise-set";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { getSetPerformance } from "~/utils/sets";

type TrainingDayExerciseSetPerformanceProps = {
  previousRunSets: NonNullable<
    NonNullable<
      (SerializeFrom<typeof loader> & {
        state: CurrentMesocycleState.STARTED;
      })["day"]["trainingDay"]
    >["exercises"][number]["previousRun"]
  >["sets"];

  set: Set;
};

export function TrainingDayExerciseSetPerformance({
  set,
  previousRunSets,
}: TrainingDayExerciseSetPerformanceProps) {
  const previousRunSet = previousRunSets.find(
    (previousSet) => previousSet.number === set.number
  );

  const performance = getSetPerformance(previousRunSet, set);

  return (
    <Transition
      show={performance !== "unknown"}
      appear={set.isNew}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 -translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <li className="mx-auto flex w-full max-w-[18rem] items-center justify-between gap-4">
        <span
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded bg-white text-sm font-bold ring-2",
            performance === "increased"
              ? "ring-green-500"
              : performance === "declined"
              ? "ring-red-500"
              : "ring-zinc-300"
          )}
        >
          S{set.number}
        </span>

        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold">
            {performance === "increased"
              ? "PERFORMANCE INCREASED"
              : performance === "declined"
              ? "PERFORMANCE DECLINED"
              : "PERFORMANCE MAINTAINED"}
          </span>

          <div className="flex items-center gap-1 text-xs">
            <span>
              {previousRunSet!.weight}x{previousRunSet!.repsCompleted}{" "}
              {previousRunSet!.rir} RIR
            </span>

            <ArrowLongRightIcon
              className={clsx(
                "h-4 w-4",
                performance === "increased"
                  ? "text-green-500"
                  : performance === "declined"
                  ? "text-red-500"
                  : "text-zinc-500"
              )}
            />

            <span>
              {set.weight}x{set.repsCompleted} {set.rir} RIR
            </span>
          </div>
        </div>

        <div
          className={clsx(
            "-ml-1",
            performance === "increased"
              ? "text-green-500"
              : performance === "declined"
              ? "text-red-500"
              : "text-zinc-500"
          )}
        >
          {performance === "increased" ? (
            <ArrowTrendingUpIcon className="h-6 w-6" />
          ) : performance === "declined" ? (
            <ArrowTrendingDownIcon className="h-6 w-6" />
          ) : (
            <ArrowPathRoundedSquareIcon className="h-6 w-6" />
          )}
        </div>
      </li>
    </Transition>
  );
}
