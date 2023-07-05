import { Form, useActionData } from "@remix-run/react";
import type { SelectedExercise, action } from "./route";
import { conform, useForm } from "@conform-to/react";
import type { RemoveExerciseFromSupersetSchema } from "./schema";
import { Intent, removeExerciseFromSupersetSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { XMarkIcon } from "@heroicons/react/20/solid";

type RemoveExerciseFromSuperSetFormProps = {
  selectedExercise: SelectedExercise;
};

export function RemoveExerciseFromSuperSetForm({
  selectedExercise,
}: RemoveExerciseFromSuperSetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const lastSubmissionExerciseId = lastSubmission?.payload
    .id as unknown as string;
  const [form, { id, intent, supersetId }] =
    useForm<RemoveExerciseFromSupersetSchema>({
      id: "remove-exercise-from-superset-modal",
      lastSubmission:
        lastSubmissionExerciseId === selectedExercise.id
          ? lastSubmission
          : undefined,
      defaultValue: {
        intent: Intent.REMOVE_EXERCISE_FROM_SUPERSET,
        id: selectedExercise.id,
        supersetId: selectedExercise.supersetId,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: removeExerciseFromSupersetSchema });
      },
    });

  const isOptimistic = selectedExercise.supersetId?.startsWith("temp-new-");

  return (
    <Form method="post" preventScrollReset replace {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />
      <input {...conform.input(supersetId, { hidden: true })} />

      <button
        type="submit"
        disabled={isOptimistic}
        className="flex w-full items-center justify-start gap-6 border-b border-zinc-200 px-6 py-4 hover:bg-zinc-50 disabled:text-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:disabled:text-zinc-800"
      >
        <XMarkIcon className="h-6 w-6" />
        <span>Remove From Superset</span>
      </button>
    </Form>
  );
}
