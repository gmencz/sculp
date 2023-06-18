import { conform, useForm } from "@conform-to/react";
import { Form, useActionData } from "@remix-run/react";
import { parse } from "@conform-to/zod";
import type { RefObject } from "react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import type { RemoveExerciseSchema } from "./schema";
import { ActionIntents, removeExerciseSchema } from "./schema";
import type { action, loader } from "./route";

type RemoveExerciseFormProps = {
  exercise: SerializeFrom<typeof loader>["trainingDay"]["exercises"][number];
  formRef: RefObject<HTMLFormElement>;
};

export function RemoveExerciseForm({
  exercise,
  formRef,
}: RemoveExerciseFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { id, actionIntent }] = useForm<RemoveExerciseSchema>({
    id: `remove-exercise-${exercise.id}`,
    lastSubmission,
    ref: formRef,
    defaultValue: {
      id: exercise.id,
      actionIntent: ActionIntents.RemoveExercise,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: removeExerciseSchema });
    },
  });

  return (
    <Form
      className="hidden"
      preventScrollReset
      replace
      method="delete"
      {...form.props}
    >
      <input {...conform.input(id, { hidden: true })} />
      <input {...conform.input(actionIntent, { hidden: true })} />
    </Form>
  );
}
