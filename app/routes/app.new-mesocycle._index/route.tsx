import { list, requestIntent, useFieldList, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, useActionData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { SubmitButton } from "~/components/submit-button";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import {
  createDraftMesocycle,
  findMesocycleByNameUserId,
} from "~/models/mesocycle.server";
import type { Schema } from "./schema";
import { durationInMicrocyclesArray } from "./schema";
import { schema, trainingDaysPerMicrocycleArray } from "./schema";
import { useState } from "react";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const {
    durationInMicrocycles,
    restDaysPerMicrocycle,
    goal,
    name,
    trainingDaysPerMicrocycle,
  } = submission.value;

  const existingMesocycle = await findMesocycleByNameUserId(name, user.id);

  if (existingMesocycle) {
    submission.error["name"] = "A mesocycle with that name already exists.";
    return json(submission, { status: 400 });
  }

  const invalidRestDays = restDaysPerMicrocycle.some((restDay) =>
    trainingDaysPerMicrocycle.includes(restDay)
  );

  if (invalidRestDays) {
    submission.error["restDaysPerMicrocycle"] =
      "The selected rest days are not valid.";
    return json(submission, { status: 400 });
  }

  return createDraftMesocycle(request, {
    durationInMicrocycles,
    goal,
    name,
    trainingDaysPerMicrocycle,
    restDaysPerMicrocycle,
  });
};

export default function NewMesocycle() {
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
    <div className="mx-auto w-full max-w-2xl py-10">
      <Heading>Plan a new mesocycle</Heading>
      <Paragraph>
        A mesocycle is a structured training plan designed to help you achieve
        maximum muscle growth. Here you can build your own to fit your
        preferences and needs.
      </Paragraph>

      <Form
        method="post"
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
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
            helperText="This will determine how long your mesocycle will be, for example if you choose 4 microcycles and you train 4 days per microcycle and rest 3 days, the microcycle will last 28 days (4 weeks). This cannot be changed later."
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
            label="On which days of each microcycle will you train?"
            helperText="For example if you want to train on Monday, Tuesday, Thursday and Friday, you would select 1, 2, 4 and 5. Please select a realistic number of days that you can commit to. More isn't better, better is better. This cannot be changed later."
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
            label="On which days of each microcycle will you rest?"
            helperText="For example if you want to train on Monday, Tuesday, Thursday and Friday and rest on Wednesday, Saturday and Sunday, you would select 3, 6 and 7. Please select a realistic number of days that you can commit to. More isn't better, better is better. This cannot be changed later."
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
    </div>
  );
}
