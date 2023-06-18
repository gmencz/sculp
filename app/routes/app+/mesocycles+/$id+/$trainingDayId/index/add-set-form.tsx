import { Form, useActionData } from "@remix-run/react";
import type { action, loader } from "./route";
import { conform, useForm } from "@conform-to/react";
import type { AddSetSchema } from "./schema";
import { ActionIntents, addSetSchema } from "./schema";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { parse } from "@conform-to/zod";
import { generateId } from "~/utils/ids";
import { SubmitButton } from "~/components/submit-button";

type AddSetFormProps = {
  exercise: SerializeFrom<typeof loader>["trainingDay"]["exercises"][number];
};

export function AddSetForm({ exercise }: AddSetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { id, actionIntent, setId }] = useForm<AddSetSchema>({
    id: `add-set-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      actionIntent: ActionIntents.AddSet,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: addSetSchema });
    },
  });

  return (
    <Form
      preventScrollReset
      replace
      method="post"
      className="mt-4 px-4 sm:px-6 lg:px-8"
      {...form.props}
    >
      <input {...conform.input(id, { hidden: true })} />
      <input {...conform.input(actionIntent, { hidden: true })} />
      <input
        {...conform.input(setId, { hidden: true })}
        readOnly
        value={generateId()}
      />

      <SubmitButton
        isSubmitting={false}
        secondary
        className="w-full ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
        text="Add set"
      />
    </Form>
  );
}
