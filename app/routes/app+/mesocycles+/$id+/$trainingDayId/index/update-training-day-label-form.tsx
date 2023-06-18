import { conform, useForm } from "@conform-to/react";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { useEffect, useState } from "react";
import { useDebounce } from "~/utils/hooks";
import type { UpdateTrainingDayLabelSchema } from "./schema";
import { ActionIntents, updateTrainingDayLabelSchema } from "./schema";
import type { action, loader } from "./route";
import { generateId } from "~/utils/ids";

export function TrainingDayLabelForm() {
  const { trainingDay } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, { label, actionIntent }] = useForm<UpdateTrainingDayLabelSchema>(
    {
      id: "update-training-day-label-form",
      lastSubmission,
      defaultValue: {
        label: trainingDay.label,
        actionIntent: ActionIntents.UpdateTrainingDayLabel,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateTrainingDayLabelSchema });
      },
    }
  );

  const [shouldUpdate, setShouldUpdate] = useState<string>("");
  const debouncedShouldUpdate = useDebounce(shouldUpdate, 1500);
  const submit = useSubmit();

  useEffect(() => {
    if (debouncedShouldUpdate) {
      submit(form.ref.current, {
        replace: true,
      });
    }
  }, [submit, form.ref, debouncedShouldUpdate]);

  const handleFormChange = () => {
    setShouldUpdate(generateId());
  };

  return (
    <Form
      method="post"
      onChange={handleFormChange}
      replace
      className="px-4 sm:px-6 lg:px-8"
      {...form.props}
    >
      <div className="mx-auto w-full max-w-2xl">
        <input {...conform.input(actionIntent, { hidden: true })} />
        <Input label="Label" config={label} />
      </div>
    </Form>
  );
}
