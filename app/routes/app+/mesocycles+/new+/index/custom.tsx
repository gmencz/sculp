import { list, requestIntent, useFieldList, useForm } from "@conform-to/react";
import { Form, useActionData } from "@remix-run/react";
import { useState } from "react";
import type { Schema } from "./schema";
import {
  durationInMicrocyclesArray,
  trainingDaysPerMicrocycleArray,
} from "./schema";
import { schema } from "./schema";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { SubmitButton } from "~/components/submit-button";

export function CustomMesocycle() {
  const lastSubmission = useActionData() as any;
  const [restDaysOptions, setRestDaysOptions] = useState<number[]>([]);
  const [
    form,
    {
      name,
      durationInMicrocycles,
      goal,
      trainingDaysPerMicrocycle,
      restDaysPerMicrocycle,
    },
  ] = useForm<Schema>({
    id: "new-mesocycle",
    lastSubmission,
    defaultValue: {
      durationInMicrocycles: "Select microcycles",
      trainingDaysPerMicrocycle: [],
      restDaysPerMicrocycle: [],
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const trainingDaysPerMicrocycleList = useFieldList(
    form.ref,
    trainingDaysPerMicrocycle
  );

  const restDaysPerMicrocycleList = useFieldList(
    form.ref,
    restDaysPerMicrocycle
  );

  return (
    <Form method="post" className="mb-8 mt-6" {...form.props}>
      <div className="flex flex-col gap-6">
        <Input
          config={name}
          label="Name"
          placeholder="My New Mesocycle"
          autoComplete="mesocycle-name"
        />

        <Select
          config={durationInMicrocycles}
          options={durationInMicrocyclesArray.map((o) => o.toString())}
          label="Microcycles"
          helperText="This cannot be changed later."
        />

        <Select
          config={trainingDaysPerMicrocycle}
          options={trainingDaysPerMicrocycleArray.map((d) => d.toString())}
          multipleOptions={{
            formRef: form.ref,
            list: trainingDaysPerMicrocycleList,
            min: 1,
            max: 7,
            emptyOption: "Select training days",
          }}
          onChange={(selectedDays: number[]) => {
            restDaysPerMicrocycleList.forEach(({ defaultValue }, index) => {
              if (selectedDays.includes(Number(defaultValue))) {
                requestIntent(
                  form.ref.current!,
                  list.remove(restDaysPerMicrocycle.name, {
                    index: index === 0 ? 0 : index,
                  })
                );
              }
            });

            setRestDaysOptions(
              trainingDaysPerMicrocycleArray.filter(
                (day) => !selectedDays.includes(day)
              )
            );
          }}
          label="Training days"
          helperText="Please select a realistic number of days that you can commit to. This cannot be changed later."
        />

        <Select
          config={restDaysPerMicrocycle}
          options={restDaysOptions.map((d) => d.toString())}
          disabled={restDaysOptions.length === 0}
          multipleOptions={{
            formRef: form.ref,
            list: restDaysPerMicrocycleList,
            min: 1,
            max: 7,
            emptyOption:
              restDaysOptions.length === 0
                ? "Select training days first"
                : "Select rest days",
          }}
          label="Rest days"
          helperText="This cannot be changed later."
        />

        <Input
          config={goal}
          label="Goal"
          placeholder="Overall hypertrophy, bringing up legs..."
        />

        <SubmitButton text="Save and continue" />
      </div>
    </Form>
  );
}
