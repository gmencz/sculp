import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { configRoutes } from "~/utils/routes";
import type { SelectedExercise, SelectedSet, action, loader } from "./route";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { useMemo, useState } from "react";
import { Set } from "./set";
import { conform, useForm } from "@conform-to/react";
import type { UpdateExerciseNotesSchema } from "./schema";
import { Intent, updateExerciseNotesSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { useDebouncedSubmit, useResetCallback } from "~/utils/hooks";
import { Textarea } from "~/components/textarea";
import clsx from "clsx";

type ExerciseProps = {
  exercise: SerializeFrom<typeof loader>["routine"]["exercises"][number];
  routine: Pick<
    SerializeFrom<typeof loader>["routine"],
    "trackRir" | "previousValuesFrom"
  >;
  setSelectedExercise: (
    value: React.SetStateAction<SelectedExercise | null>
  ) => void;
  setShowExerciseOptionsModal: (value: React.SetStateAction<boolean>) => void;
  setSelectedSet: (value: React.SetStateAction<SelectedSet | null>) => void;
  setShowSetModal: (value: React.SetStateAction<boolean>) => void;
};

export function Exercise({
  exercise,
  routine,
  setSelectedExercise,
  setShowExerciseOptionsModal,
  setSelectedSet,
  setShowSetModal,
}: ExerciseProps) {
  const [sets, setSets] = useState(exercise.sets);
  const { weightUnitPreference } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, { notes, intent }] = useForm<UpdateExerciseNotesSchema>({
    id: `update-exercise-${exercise.id}-notes`,
    lastSubmission,
    defaultValue: {
      intent: Intent.UPDATE_EXERCISE_NOTES,
      notes: exercise.notes,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateExerciseNotesSchema });
    },
  });

  const submit = useDebouncedSubmit(form.ref.current, {
    preventScrollReset: true,
    replace: true,
  });

  useResetCallback(exercise.sets, () => {
    setSets(exercise.sets);
  });

  const normalSets = useMemo(
    () =>
      sets
        .filter((set) => set.type === "NORMAL")
        .map((set, index) => ({
          id: set.id,
          number: index + 1,
        })),
    [sets]
  );

  return (
    <li>
      <div className="flex items-center justify-between gap-4 px-4">
        <Link
          to={configRoutes.app.viewExercise(exercise.id)}
          className="flex-1 rounded-lg py-2 text-orange-500 hover:text-orange-600"
        >
          {exercise.exercise.name}
        </Link>

        <button
          className="-m-2 p-2 text-orange-500 hover:text-orange-600"
          onClick={() => {
            setSelectedExercise({
              id: exercise.id,
              name: exercise.exercise.name,
              supersetId: exercise.superset?.id,
            });

            setShowExerciseOptionsModal(true);
          }}
        >
          <EllipsisVerticalIcon className="h-6 w-6" />
          <span className="sr-only">Options</span>
        </button>
      </div>

      <Form
        className="mt-2 px-4"
        method="post"
        onChange={submit}
        {...form.props}
      >
        <input {...conform.input(intent, { hidden: true })} />

        <Textarea
          config={notes}
          label="Exercise Notes"
          hideLabel
          autoSize
          placeholder="Write a note"
        />
      </Form>

      {sets.length > 0 ? (
        <div role="table" className="mx-auto mt-6 table w-full pl-3">
          <div role="rowgroup" className="table-header-group">
            <div role="row" className="table-row">
              <div
                role="columnheader"
                className="table-cell w-[1%] pb-2.5 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50"
              >
                Set
              </div>
              <div
                role="columnheader"
                className="table-cell w-[1%] pb-2.5 pl-5 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50"
              >
                Previous
              </div>
              <div
                role="columnheader"
                className={clsx(
                  "table-cell pb-2.5 pl-5 pr-2 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50",
                  routine.trackRir ? "w-[25%] sm:w-auto" : "w-[30%] sm:w-auto"
                )}
              >
                {weightUnitPreference}
              </div>
              <div
                role="columnheader"
                className={clsx(
                  "table-cell pb-2.5 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50",
                  routine.trackRir
                    ? "w-[15%] pr-2 sm:w-auto"
                    : "w-[26%] pr-3 sm:w-auto"
                )}
              >
                Reps
              </div>

              {routine.trackRir ? (
                <div
                  role="columnheader"
                  className="table-cell w-[15%] pb-2.5 pr-3 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50 sm:w-auto"
                >
                  RIR
                </div>
              ) : null}
            </div>
          </div>

          <div role="rowgroup" className="table-row-group">
            {sets.map((set) => (
              <Set
                key={set.id}
                routine={routine}
                set={set}
                normalSets={normalSets}
                setSelectedSet={setSelectedSet}
                setShowSetModal={setShowSetModal}
              />
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}
