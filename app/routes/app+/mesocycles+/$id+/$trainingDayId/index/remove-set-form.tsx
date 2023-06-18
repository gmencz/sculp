import { Form, useActionData } from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { TrashIcon } from "@heroicons/react/20/solid";
import type { RefObject } from "react";
import type { Set } from "./set";
import type { action } from "./route";
import type { RemoveSetSchema } from "./schema";
import { ActionIntents, removeSetSchema } from "./schema";

type RemoveSetFormProps = {
  set: Set;
  isBeingCreated: boolean;
  formRef: RefObject<HTMLFormElement>;
};

export function RemoveSetForm({
  set,
  isBeingCreated,
  formRef,
}: RemoveSetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { id, actionIntent }] = useForm<RemoveSetSchema>({
    id: `remove-set-${set.id}`,
    lastSubmission,
    ref: formRef,
    defaultValue: {
      id: set.id,
      actionIntent: ActionIntents.RemoveSet,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: removeSetSchema });
    },
  });

  return (
    <Form
      className="hidden sm:block"
      role="cell"
      method="delete"
      {...form.props}
    >
      <input {...conform.input(id, { hidden: true })} />
      <input {...conform.input(actionIntent, { hidden: true })} />

      <button
        type="submit"
        disabled={isBeingCreated}
        className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-red-100"
      >
        <TrashIcon className="h-5 w-5" />
        <span className="sr-only">Remove</span>
      </button>
    </Form>
  );
}
