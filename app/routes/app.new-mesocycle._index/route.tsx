import { useFieldList, useForm } from "@conform-to/react";
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
import {
  durationInWeeksArray,
  schema,
  trainingDaysPerMicrocycleArray,
} from "./schema";

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

  const { durationInWeeks, goal, name, trainingDaysPerMicrocycle } =
    submission.value;
  const existingMesocycle = await findMesocycleByNameUserId(name, user.id);

  if (existingMesocycle) {
    submission.error["name"] = "A mesocycle with that name already exists.";
    return json(submission, { status: 400 });
  }

  return createDraftMesocycle(request, {
    durationInWeeks,
    goal,
    name,
    trainingDaysPerMicrocycle,
  });
};

export default function NewMesocycle() {
  const lastSubmission = useActionData();
  const [form, { name, durationInWeeks, goal, trainingDaysPerMicrocycle }] =
    useForm<Schema>({
      id: "new-mesocycle",
      lastSubmission,
      defaultValue: {
        durationInWeeks: "Select weeks",
        trainingDaysPerMicrocycle: [],
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  const trainingDaysPerMicrocycleList = useFieldList(
    form.ref,
    trainingDaysPerMicrocycle
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
            config={durationInWeeks}
            options={durationInWeeksArray}
            label="How many weeks will the mesocycle last?"
            helperText="You can repeat the mesocycle once it's over. If you're unsure what to choose, we recommend 12 weeks. This cannot be changed later."
          />

          <Select
            config={trainingDaysPerMicrocycle}
            options={trainingDaysPerMicrocycleArray}
            multipleOptions={{
              formRef: form.ref,
              list: trainingDaysPerMicrocycleList,
              min: 1,
              max: 7,
              emptyOption: "Please select days",
            }}
            label="On which days of the microcycle will you train?"
            helperText="For example if you want to train on Monday, Tuesday, Thursday and Friday, you would select 1, 2, 4 and 5. Or if for example you want to train 3 days and rest 1 day, you would select 1, 2, 3, 5, 6, 7. Please select a realistic number of days that you can commit to. More isn't better, better is better. This cannot be changed later."
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
