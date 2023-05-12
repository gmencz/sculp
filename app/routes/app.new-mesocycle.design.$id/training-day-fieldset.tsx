import type { FieldConfig } from "@conform-to/react";
import { useFieldset } from "@conform-to/react";
import type { Schema, loader } from "./route";
import { useRef } from "react";
import { Input } from "~/components/input";
import { Link, useLoaderData } from "@remix-run/react";
import { MODAL_NAME as ADD_EXERCISE_MODAL_NAME } from "./add-exercise-modal";
import { MODAL_NAME as DELETE_EXERCISE_MODAL_NAME } from "./delete-exercise-modal";

type TrainingDayFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]>;
};

export function TrainingDayFieldset(props: TrainingDayFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { label } = useFieldset(ref, props.config);
  const dayNumber = props.config.defaultValue?.dayNumber;
  const { mesocycle } = useLoaderData<typeof loader>();
  const exercises =
    mesocycle.trainingDays.find(
      (trainingDay) => `${trainingDay.dayNumber}` === dayNumber
    )?.exercises || [];

  return (
    <>
      <fieldset ref={ref}>
        <div className="border-b border-zinc-200 px-4 py-5 sm:px-6">
          <p className="text-base font-semibold leading-6 text-zinc-900">
            Training Day {dayNumber}
          </p>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <Input
            label="Label"
            config={label}
            placeholder="Push A, Upper A..."
          />

          <Link
            className="mt-4 flex w-full items-center justify-center rounded bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
            to={`.?modal=${ADD_EXERCISE_MODAL_NAME}&day_number=${dayNumber}`}
          >
            Add an exercise
          </Link>

          <ol className="mt-8 flex flex-col gap-12">
            {exercises.map((exercise, index) => (
              <li
                key={`${exercise.dayNumber}-${exercise.id}-${index}`}
                className="flex flex-col items-start"
              >
                <p className="flex items-center gap-2 text-sm font-semibold leading-6 text-zinc-900">
                  <span>{exercise.name}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
                    {index + 1}
                  </span>
                </p>

                <p className="mb-1 mt-2 text-sm text-zinc-700">
                  {exercise.notes
                    ? exercise.notes
                    : "No notes for this exercise."}
                </p>

                <table className="min-w-full divide-y divide-zinc-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-0"
                      >
                        Set
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                      >
                        RIR
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                      >
                        Reps
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                      >
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {exercise.sets.map((set, innerIndex) => (
                      <tr
                        key={`${exercise.id}-${
                          exercise.dayNumber
                        }-${index}-set-${innerIndex + 1}`}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 sm:pl-0">
                          {innerIndex + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                          {set.rir}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                          {set.repRange}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                          {set.weight}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Link
                  to={`.?modal=${DELETE_EXERCISE_MODAL_NAME}&exercise_id=${
                    exercise.id
                  }&day_number=${dayNumber}&index=${index}&exercise_name=${encodeURIComponent(
                    exercise.name
                  )}`}
                  className="flex w-full items-center justify-center gap-2 rounded-md border-0 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Delete exercise
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </fieldset>
    </>
  );
}
