import { conform, useForm } from "@conform-to/react";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import type { ReplaceExerciseFromRoutineSchema } from "./schema";
import { Intent, replaceExerciseFromRoutineSchema } from "./schema";
import { parse } from "@conform-to/zod";
import type { action, loader } from "./route";
import { Exercise } from "./exercise";
import type { SerializeFrom } from "@remix-run/server-runtime";

type ReplaceExerciseFromRoutineFormProps = {
  exercises: SerializeFrom<typeof loader>["exercises"];
};

export function ReplaceExerciseFromRoutineForm({
  exercises,
}: ReplaceExerciseFromRoutineFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [form, { intent, routineId, exerciseId, replaceExerciseId }] =
    useForm<ReplaceExerciseFromRoutineSchema>({
      id: "replace-exercise-from-routine",
      lastSubmission,
      defaultValue: {
        intent: Intent.REPLACE_EXERCISE_FROM_ROUTINE,
        routineId: searchParams.get("routineId"),
        replaceExerciseId: searchParams.get("exerciseId"),
      },
      onValidate({ formData }) {
        return parse(formData, { schema: replaceExerciseFromRoutineSchema });
      },
    });

  return (
    <Form method="post" {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(routineId, { hidden: true })} />
      <input {...conform.input(replaceExerciseId, { hidden: true })} />

      <ul className="flex flex-col gap-8">
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <button
              name={exerciseId.name}
              value={exercise.id}
              type="submit"
              className="-m-2 flex w-full items-center gap-4 p-2"
            >
              <Exercise exercise={exercise} />
            </button>
          </li>
        ))}
      </ul>
    </Form>
  );
}
