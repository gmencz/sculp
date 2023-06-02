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
  const lastSubmission = useActionData();
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
    <Form
      method="post"
      className="mt-4 rounded bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
      {...form.props}
    >
      <div className="flex flex-col gap-6 px-4 py-6 sm:p-8">
        <Input
          config={name}
          label="How do you want to name the mesocycle?"
          placeholder="My New Mesocycle"
          helperText="This cannot be changed later."
          autoComplete="mesocycle-name"
        />

        <Select
          config={durationInMicrocycles}
          options={durationInMicrocyclesArray}
          label="How many microcycles?"
          helperText="A microcycle is similar to a week, representing a short period of time within your overall mesocycle. For example, 8 microcycles would approximately be 8 weeks depending on your training days and rest days. This cannot be changed later."
        />

        <Select
          config={trainingDaysPerMicrocycle}
          options={trainingDaysPerMicrocycleArray}
          multipleOptions={{
            formRef: form.ref,
            list: trainingDaysPerMicrocycleList,
            min: 1,
            max: 7,
            emptyOption: "Please select training days",
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
          label="On which days of the microcycle will you train?"
          helperText="Please select a realistic number of days that you can commit to. This cannot be changed later."
        />

        <Select
          config={restDaysPerMicrocycle}
          options={restDaysOptions}
          disabled={restDaysOptions.length === 0}
          multipleOptions={{
            formRef: form.ref,
            list: restDaysPerMicrocycleList,
            min: 1,
            max: 7,
            emptyOption:
              restDaysOptions.length === 0
                ? "Please select training days first"
                : "Please select rest days",
          }}
          label="On which days of the microcycle will you rest?"
          helperText="This cannot be changed later."
        />

        <Input
          config={goal}
          label="What is the main goal of the mesocycle?"
          placeholder="Overall hypertrophy, bringing up legs..."
          helperText="This cannot be changed later."
        />

        <SubmitButton text="Save and continue" />
      </div>
    </Form>
  );
}
