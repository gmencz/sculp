import clsx from "clsx";
import type { CurrentMesocycleState, loader } from "../route";
import {
  ArrowLongRightIcon,
  ArrowPathRoundedSquareIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import { Transition } from "@headlessui/react";
import type { Set } from "./training-day-exercise-set";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { SetPerformance, getSetPerformance } from "~/utils/sets";

type TrainingDayExerciseSetPerformanceProps = {
  previousSets: NonNullable<
    NonNullable<
      (SerializeFrom<typeof loader> & {
        state: CurrentMesocycleState.STARTED;
      })["day"]
    >["trainingDay"]
  >["exercises"][number]["previousSets"];

  set: Set;
  index: number;
};

export function TrainingDayExerciseSetPerformance({
  set,
  index,
  previousSets,
}: TrainingDayExerciseSetPerformanceProps) {
  const previousSet = previousSets.find(
    (previousSet) => previousSet.number === set.number
  );

  const performance = getSetPerformance(previousSet, set);

  const hasAnyData = Boolean(previousSet) || set.completed;

  return (
    <Transition
      show
      as="li"
      appear={set.isNew}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 -translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className="mx-auto flex w-full max-w-xs items-center justify-between gap-4 text-zinc-900 dark:text-zinc-50"
    >
      <span
        className={clsx(
          "flex h-8 w-8 items-center justify-center rounded bg-white text-sm font-bold ring-2 dark:bg-zinc-950",
          performance === SetPerformance.INCREASED
            ? "ring-green-500"
            : performance === SetPerformance.DECLINED
            ? "ring-red-500"
            : "ring-zinc-300 dark:ring-zinc-700"
        )}
      >
        S{index + 1}
      </span>

      <div className="flex flex-col items-center justify-center gap-0.5 text-center">
        <span className="text-xs font-bold">
          {performance === SetPerformance.INCREASED
            ? "PERFORMANCE INCREASED"
            : performance === SetPerformance.DECLINED
            ? "PERFORMANCE DECLINED"
            : performance === SetPerformance.MAINTAINED
            ? "PERFORMANCE MAINTAINED"
            : "PERFORMANCE UNKNOWN"}
        </span>

        {hasAnyData ? (
          <>
            <div className="flex items-center gap-1 text-xs">
              {previousSet ? (
                <span>
                  {previousSet.weight}x{previousSet.repsCompleted}{" "}
                  {previousSet.rir} RIR
                </span>
              ) : (
                <span>No previous data</span>
              )}

              <ArrowLongRightIcon
                className={clsx(
                  "h-4 w-4",
                  performance === SetPerformance.INCREASED
                    ? "text-green-500"
                    : performance === SetPerformance.DECLINED
                    ? "text-red-500"
                    : "text-zinc-500 dark:text-zinc-300"
                )}
              />

              {set.completed ? (
                <span className="tracking-tight">
                  {set.weight}x{set.repsCompleted} {set.rir} RIR
                </span>
              ) : (
                <span>Set incomplete</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center text-xs">
            <span>Set incomplete</span>
          </div>
        )}
      </div>

      <div
        className={clsx(
          "-ml-1",
          performance === SetPerformance.INCREASED
            ? "text-green-500"
            : performance === SetPerformance.DECLINED
            ? "text-red-500"
            : "text-zinc-500 dark:text-zinc-300"
        )}
      >
        {performance === SetPerformance.INCREASED ? (
          <ArrowTrendingUpIcon className="h-6 w-6" />
        ) : performance === SetPerformance.DECLINED ? (
          <ArrowTrendingDownIcon className="h-6 w-6" />
        ) : performance === SetPerformance.MAINTAINED ? (
          <ArrowPathRoundedSquareIcon className="h-6 w-6" />
        ) : (
          <QuestionMarkCircleIcon className="h-6 w-6" />
        )}
      </div>
    </Transition>
  );
}
