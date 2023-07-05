import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import { format } from "date-fns";
import { useMemo } from "react";
import { Link } from "@remix-run/react";

type ExercisePerformanceProps = {
  performance: SerializeFrom<typeof loader>["performances"][number];
  weightUnitPreference: SerializeFrom<typeof loader>["weightUnitPreference"];
};

export function ExercisePerformance({
  performance,
  weightUnitPreference,
}: ExercisePerformanceProps) {
  const normalSets = useMemo(
    () =>
      performance.sets
        .filter((set) => set.type === "NORMAL")
        .map((set, index) => ({
          id: set.id,
          number: index + 1,
        })),
    [performance.sets]
  );

  return (
    <li className="relative rounded-md border border-zinc-200 text-base hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
      <Link
        to={`/app/training-sessions/${performance.trainingSession!.id}`}
        className="block p-4"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="font-medium">
            {performance.trainingSession!.name}
          </span>
        </div>

        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {format(
            new Date(performance.trainingSession!.startedAt),
            "EEEE', 'MMMM' 'd', 'yyyy"
          )}
        </p>

        <ol className="mt-3 flex flex-col gap-1">
          {performance.sets.map((set) => (
            <PerformanceSet
              key={set.id}
              normalSets={normalSets}
              set={set}
              weightUnitPreference={weightUnitPreference}
            />
          ))}
        </ol>
      </Link>
    </li>
  );
}

type PerformanceSetProps = {
  normalSets: {
    id: string;
    number: number;
  }[];
  set: SerializeFrom<typeof loader>["performances"][number]["sets"][number];
  weightUnitPreference: SerializeFrom<typeof loader>["weightUnitPreference"];
};

function PerformanceSet({
  set,
  weightUnitPreference,
  normalSets,
}: PerformanceSetProps) {
  const normalSet = useMemo(
    () => normalSets.find((normalSet) => normalSet.id === set.id),
    [normalSets, set.id]
  );

  return (
    <li
      className="flex text-sm lowercase text-zinc-700 dark:text-zinc-300"
      key={set.id}
    >
      <div className="flex items-start gap-4">
        <div className="flex w-4 items-center justify-center uppercase">
          {set.type === "NORMAL" ? (
            <span className="text-orange-500">
              {normalSet?.number || set.number}
            </span>
          ) : set.type === "CLUSTER" ? (
            <span className="text-purple-600">C</span>
          ) : set.type === "DROP" ? (
            <span className="text-lime-500">D</span>
          ) : set.type === "WARM_UP" ? (
            <span className="text-blue-400">W</span>
          ) : null}
        </div>

        <span>
          {set.weight} {weightUnitPreference} x {set.reps}
        </span>
      </div>
    </li>
  );
}
