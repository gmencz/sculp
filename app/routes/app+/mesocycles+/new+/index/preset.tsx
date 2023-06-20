import { useForm } from "@conform-to/react";
import type { Schema } from "./schema";
import { WeightUnitPreference, durationInMicrocyclesArray } from "./schema";
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
      weightUnitPreference,
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
      weightUnitPreference: "Select weight unit",
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
    <Form method="post" className="mt-4" {...form.props}>
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

      <div className="mt-6 flex flex-col gap-6 rounded-lg bg-white px-4 py-6 shadow-sm ring-1 ring-zinc-900/5 sm:p-8">
        <Input
          config={name}
          label="How do you want to name the mesocycle?"
          placeholder="My New Mesocycle"
          autoComplete="mesocycle-name"
        />

        <Select
          config={weightUnitPreference}
          options={Object.keys(WeightUnitPreference)}
          label="What is the prefered weight unit for this mesocycle?"
          helperText="This cannot be changed later."
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
