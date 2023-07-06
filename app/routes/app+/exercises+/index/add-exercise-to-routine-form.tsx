import { conform, useForm } from "@conform-to/react";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import type { AddExerciseToRoutineSchema } from "./schema";
import { Intent, addExerciseToRoutineSchema } from "./schema";
import { parse } from "@conform-to/zod";
import type { action, loader } from "./route";
import { Exercise } from "./exercise";
import type { SerializeFrom } from "@remix-run/server-runtime";

type AddExerciseToRoutineFormProps = {
  exercises: SerializeFrom<typeof loader>["exercises"];
};

export function AddExerciseToRoutineForm({
  exercises,
}: AddExerciseToRoutineFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [form, { intent, routineId, exerciseId }] =
    useForm<AddExerciseToRoutineSchema>({
      id: "add-exercise-to-routine",
      lastSubmission,
      defaultValue: {
        intent: Intent.ADD_EXERCISE_TO_ROUTINE,
        routineId: searchParams.get("routineId"),
      },
      onValidate({ formData }) {
        return parse(formData, { schema: addExerciseToRoutineSchema });
      },
    });

  return (
    <Form method="post" {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(routineId, { hidden: true })} />

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
