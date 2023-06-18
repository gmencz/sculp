import { conform, useForm } from "@conform-to/react";
import { Form, useActionData, useSubmit } from "@remix-run/react";
import { ActionIntents, updateSetSchema, type UpdateSetSchema } from "./schema";
import type { Set } from "./set";
import type { action } from "./route";
import { parse } from "@conform-to/zod";
import { useDebounce } from "~/utils/hooks";
import { useEffect, useState } from "react";
import { Input } from "~/components/input";
import { generateId } from "~/utils/ids";

type UpdateSetFormProps = {
  set: Set;
};

export function UpdateSetForm({ set }: UpdateSetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { id, repRange, rir, weight, actionIntent }] =
    useForm<UpdateSetSchema>({
      id: `update-set-${set.id}`,
      lastSubmission,
      defaultValue: {
        id: set.id,
        repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
        rir: set.rir.toString(),
        weight: set.weight?.toString(),
        actionIntent: ActionIntents.UpdateSet,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateSetSchema });
      },
    });

  const submit = useSubmit();
  const [shouldSubmit, setShouldSubmit] = useState<string>("");
  const debouncedShouldSubmit = useDebounce(shouldSubmit, 1500);

  useEffect(() => {
    if (debouncedShouldSubmit) {
      submit(form.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [form.ref, submit, debouncedShouldSubmit]);

  return (
    <Form
      preventScrollReset
      replace
      method="post"
      onChange={() => setShouldSubmit(generateId())}
      className="flex items-center gap-3"
      {...form.props}
    >
      <div role="cell" className="flex-1">
        <input {...conform.input(id, { hidden: true })} />
        <input {...conform.input(actionIntent, { hidden: true })} />

        <Input
          hideErrorMessage
          hideLabel
          config={weight}
          label="Weight"
          type="number"
          className="text-center"
          min={0}
          max={10000}
        />
      </div>

      <div role="cell" className="flex-1">
        <Input
          hideErrorMessage
          hideLabel
          config={repRange}
          label="Rep range"
          className="text-center"
        />
      </div>

      <div role="cell" className="flex-1">
        <Input
          hideErrorMessage
          hideLabel
          config={rir}
          label="RIR"
          type="number"
          className="text-center"
          min={0}
        />
      </div>
    </Form>
  );
}
