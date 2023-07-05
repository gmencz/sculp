import { PlusIcon } from "@heroicons/react/20/solid";
import { Form, useActionData } from "@remix-run/react";
import clsx from "clsx";
import { classes } from "~/utils/classes";
import type { action } from "./route";
import { conform, useForm } from "@conform-to/react";
import type { AddSetSchema } from "./schema";
import { Intent, addSetSchema } from "./schema";
import { parse } from "@conform-to/zod";

type AddSetFormProps = {
  exerciseId: string;
};

export function AddSetForm({ exerciseId }: AddSetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const lastSubmissionExerciseId = lastSubmission?.payload
    .exerciseId as unknown as string;
  const [form, { intent, exerciseId: exerciseIdConfig }] =
    useForm<AddSetSchema>({
      id: `add-set-${exerciseId}`,
      lastSubmission:
        lastSubmissionExerciseId === exerciseId ? lastSubmission : undefined,
      defaultValue: {
        intent: Intent.ADD_SET,
        exerciseId,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: addSetSchema });
      },
    });

  return (
    <Form
      method="post"
      className="mt-4 flex items-center justify-center px-4"
      replace
      preventScrollReset
      {...form.props}
    >
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(exerciseIdConfig, { hidden: true })} />

      <button
        className={clsx(classes.buttonOrLink.secondary, "w-full text-sm")}
      >
        <PlusIcon className="-ml-2 h-5 w-5" />
        <span>Add Set</span>
      </button>
    </Form>
  );
}
