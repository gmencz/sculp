import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";

type ExerciseProps = {
  exercise: SerializeFrom<typeof loader>["exercises"][number];
};

export function Exercise({ exercise }: ExerciseProps) {
  return (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl font-medium uppercase dark:bg-zinc-800">
        {exercise.name.charAt(0)}
      </span>

      <div className="flex flex-1 flex-col items-start gap-0.5">
        <span className="text-left font-medium">{exercise.name}</span>

        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          <span>
            {exercise.primaryMuscleGroups
              .map((muscleGroup) => muscleGroup.name)
              .join(", ")}
          </span>
        </div>
      </div>
    </>
  );
}
