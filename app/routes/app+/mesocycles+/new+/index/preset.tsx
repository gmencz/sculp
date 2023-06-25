import { useForm } from "@conform-to/react";
import type { Schema } from "./schema";
import { durationInMicrocyclesArray } from "./schema";
import { schema } from "./schema";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { SubmitButton } from "~/components/submit-button";
import { Select } from "~/components/select";
import type { action } from "./route";
import { type loader } from "./route";
import { Fragment, useState } from "react";

export function PresetMesocycle() {
  const { mesocyclesPresets } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [
    form,
    {
      name,
      durationInMicrocycles,
      goal,
      trainingDaysPerMicrocycle,
      restDaysPerMicrocycle,
      presetName,
    },
  ] = useForm<Schema>({
    id: "new-mesocycle",
    lastSubmission,
    shouldRevalidate: "onBlur",
    defaultValue: {
      durationInMicrocycles: mesocyclesPresets[0].microcycles.toString(),
      presetName: mesocyclesPresets[0].name,
      trainingDaysPerMicrocycle: mesocyclesPresets[0].trainingDays.map((day) =>
        day.number.toString()
      ),
      restDaysPerMicrocycle: mesocyclesPresets[0].restDays.map((day) =>
        day.toString()
      ),
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const [selectedPresetName, setSelectedPresetName] = useState(
    presetName.defaultValue!
  );

  const selectedPreset = mesocyclesPresets.find(
    (preset) => preset.name === selectedPresetName
  )!;

  return (
    <Form method="post" className="mt-6" {...form.props}>
      <Select
        config={presetName}
        options={mesocyclesPresets.map((preset) => preset.name)}
        label="Choose a preset"
        onChange={setSelectedPresetName}
      />

      {selectedPreset.restDays.map((restDayNumber, index) => (
        <Fragment key={restDayNumber}>
          <input
            type="hidden"
            id={`${form.id}-${restDaysPerMicrocycle.name}[${index}]`}
            name={`${restDaysPerMicrocycle.name}[${index}]`}
            value={restDayNumber}
          />
        </Fragment>
      ))}

      {selectedPreset.trainingDays.map((trainingDay, index) => (
        <Fragment key={trainingDay.number}>
          <input
            type="hidden"
            id={`${form.id}-${trainingDaysPerMicrocycle.name}[${index}]`}
            name={`${trainingDaysPerMicrocycle.name}[${index}]`}
            value={trainingDay.number}
          />
        </Fragment>
      ))}

      <div className="mt-6 flex flex-col gap-6">
        <Input
          config={name}
          label="How do you want to call the mesocycle?"
          placeholder="My New Mesocycle"
          autoComplete="mesocycle-name"
        />

        <Select
          config={durationInMicrocycles}
          options={durationInMicrocyclesArray.map((o) => o.toString())}
          controlledValue={selectedPreset.microcycles.toString()}
          label="How many microcycles?"
          helperText="This cannot be changed later."
        />

        <Input
          config={goal}
          label="What is the main goal of the mesocycle?"
          placeholder="Overall hypertrophy, bringing up legs..."
        />

        <SubmitButton text="Save and continue" />
      </div>
    </Form>
  );
}
