import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import type { CurrentMesocycleStartedData } from "../route";
import { TrainingDayExerciseSetPerformance } from "./training-day-exercise-set-performance";

type TrainingDayExerciseReadOnlyProps = {
  exercise: NonNullable<
    CurrentMesocycleStartedData["day"]["trainingDay"]
  >["exercises"][number];
};

export function TrainingDayExerciseReadOnly({
  exercise,
}: TrainingDayExerciseReadOnlyProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded border-b border-zinc-200 bg-white pb-12 pt-4">
      <div className="flex items-center gap-8 px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap gap-2">
          {exercise.exercise.muscleGroups.map((muscleGroup, index) => (
            <li key={muscleGroup.name}>
              <MuscleGroupBadge index={index}>
                {muscleGroup.name}
              </MuscleGroupBadge>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
          {exercise.exercise.name}
        </h3>

        {exercise.notes ? (
          <p className="mt-2 text-sm">{exercise.notes}</p>
        ) : null}
      </div>

      <table className="mt-3 min-w-full divide-y divide-zinc-300">
        <thead>
          <tr>
            <th
              scope="col"
              className="py-2 pl-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900 sm:pl-0"
            >
              Set
            </th>
            <th
              scope="col"
              className="py-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900"
            >
              Weight
            </th>
            <th
              scope="col"
              className="py-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900"
            >
              Rep range
            </th>
            <th
              scope="col"
              className="py-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900"
            >
              RIR
            </th>
            <th
              scope="col"
              className="py-2 pr-2 text-center text-xs font-medium uppercase text-zinc-900 sm:pr-0"
            >
              Reps
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {exercise.sets.map((set) => (
            <tr key={set.id} className="text-center text-sm text-zinc-900">
              <td className="py-2 pl-2 pr-3 font-medium sm:pl-0">
                {set.number}
              </td>
              <td className="py-2 pr-3">{set.weight}</td>
              <td className="py-2 pr-3">
                {set.repRangeLowerBound}-{set.repRangeUpperBound}
              </td>
              <td className="py-2 pr-3">{set.rir}</td>
              <td className="py-2 pr-2 sm:pr-0">{set.repsCompleted}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {exercise.previousRun ? (
        <div className="mt-2 px-4 py-4 sm:px-6 lg:px-8">
          <ol className="flex flex-col gap-4">
            {exercise.sets.map((set) => (
              <TrainingDayExerciseSetPerformance
                previousRunSets={exercise.previousRun?.sets || []}
                set={{ ...set, isNew: false }}
                key={`${set.id}-performance-change`}
              />
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
