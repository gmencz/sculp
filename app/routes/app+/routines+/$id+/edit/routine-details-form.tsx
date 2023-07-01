import { Form, useActionData } from "@remix-run/react";
import type { action, loader } from "./route";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import type { UpdateRoutineDetailsSchema } from "./schema";
import { Intent, updateRoutineDetailsSchema } from "./schema";
import { Textarea } from "~/components/textarea";
import { useDebouncedSubmit } from "~/utils/hooks";
import type { SerializeFrom } from "@remix-run/server-runtime";

type RoutineDetailsFormProps = {
  routine: Pick<SerializeFrom<typeof loader>["routine"], "name" | "notes">;
};

export function RoutineDetailsForm({ routine }: RoutineDetailsFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { name, notes, intent }] = useForm<UpdateRoutineDetailsSchema>({
    id: "update-routine-details",
    lastSubmission,
    defaultValue: {
      intent: Intent.UPDATE_ROUTINE_DETAILS,
      name: routine.name,
      notes: routine.notes,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateRoutineDetailsSchema });
    },
  });

  const submit = useDebouncedSubmit(form.ref.current, {
    preventScrollReset: true,
    replace: true,
  });

  return (
    <Form method="post" onChange={submit} {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />

      <Input config={name} label="Routine Name" hideLabel />

      <div className="mt-4">
        <Textarea
          config={notes}
          label="Routine Notes"
          hideLabel
          autoSize
          placeholder="Write a note"
        />
      </div>
    </Form>
  );
}
