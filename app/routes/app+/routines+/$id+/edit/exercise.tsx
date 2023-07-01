import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { configRoutes } from "~/utils/routes";
import type { SelectedExercise, action, loader } from "./route";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { Set } from "./set";
import { conform, useForm } from "@conform-to/react";
import type { UpdateExerciseNotesSchema } from "./schema";
import { Intent, updateExerciseNotesSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { useDebouncedSubmit } from "~/utils/hooks";
import { Textarea } from "~/components/textarea";

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
};

export function Exercise({
  exercise,
  routine,
  setSelectedExercise,
  setShowExerciseOptionsModal,
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
        <div role="table" className="mt-6">
          <div role="rowgroup">
            <div role="row" className="flex items-center gap-12 px-4">
              <div
                role="columnheader"
                className="text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
              >
                Set
              </div>
              <div
                role="columnheader"
                className="text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
              >
                {weightUnitPreference}
              </div>
              <div
                role="columnheader"
                className="text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
              >
                Reps
              </div>

              {routine.trackRir ? (
                <div
                  role="columnheader"
                  className="text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
                >
                  RIR
                </div>
              ) : null}
            </div>
          </div>

          <div role="rowgroup" className="flex flex-col">
            {sets.map((set) => (
              <Set key={set.id} set={set} />
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}
