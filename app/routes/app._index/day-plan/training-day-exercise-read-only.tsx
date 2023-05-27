import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import type { CurrentMesocycleStartedData } from "../route";
import { TrainingDayExerciseSetPerformance } from "./training-day-exercise-set-performance";

type TrainingDayExerciseReadOnlyProps = {
  exercise: NonNullable<
    CurrentMesocycleStartedData["day"]["trainingDay"]
  >["exercises"][number];
  completedDay: boolean;
};

export function TrainingDayExerciseReadOnly({
  exercise,
  completedDay,
}: TrainingDayExerciseReadOnlyProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded border-b border-zinc-200 bg-white pt-4">
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

      <table className="mt-3 min-w-full divide-y divide-zinc-300 border-b border-zinc-300">
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

      <div className="mt-2 px-4 py-4 sm:px-6 lg:px-8">
        {exercise.previousRun ? (
          <ol className="flex flex-col gap-4">
            {exercise.sets.map((set) => (
              <TrainingDayExerciseSetPerformance
                previousRunSets={exercise.previousRun?.sets || []}
                set={{ ...set, isNew: false }}
                key={`${set.id}-performance-change`}
              />
            ))}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-900"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
            </svg>
            {completedDay ? (
              <p className="text-center text-sm font-medium text-zinc-900">
                Your performance was tracked for your next training session.
              </p>
            ) : (
              <p className="text-center text-sm font-medium text-zinc-900">
                Your performance will be tracked for your next training session.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
