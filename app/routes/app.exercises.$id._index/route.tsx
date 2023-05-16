import { useFieldList, useForm } from "@conform-to/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { getExercise } from "~/models/exercise.server";
import { requireUser } from "~/session.server";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Heading } from "~/components/heading";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { JointPain } from "@prisma/client";
import { getMuscleGroups } from "~/models/muscle-groups.server";
import { parse } from "@conform-to/zod";
import { SubmitButton } from "~/components/submit-button";

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  throw new Error("Not implemented");
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const exercise = await getExercise(id, user.id);
  if (!exercise) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const muscleGroups = await getMuscleGroups();

  return json({
    exercise,
    jointPainEnum: JointPain,
    muscleGroupsOptions: muscleGroups.map((m) => m.name),
  });
};

export default function Exercise() {
  const { exercise, jointPainEnum, muscleGroupsOptions } =
    useLoaderData<typeof loader>();

  const lastSubmission = useActionData();

  const [form, { name, jointPain, muscleGroups }] = useForm<Schema>({
    id: "edit-exercise",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      name: exercise.name,
      jointPain: exercise.jointPain || jointPainEnum.NONE,
      muscleGroups: exercise.muscleGroups.map(
        (muscleGroup) => muscleGroup.name
      ),
    },
  });

  const muscleGroupsList = useFieldList(form.ref, muscleGroups);

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <Heading>Edit exercise</Heading>

      <Form
        method="post"
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
        {...form.props}
      >
        <div className="flex flex-col gap-6 px-4 py-6 sm:p-8">
          <Input config={name} label="Name" autoComplete="exercise-name" />

          <Select
            config={jointPain}
            options={Object.values(jointPainEnum)}
            capitalizeOptions
            label="Joint Pain"
          />

          <Select
            config={muscleGroups}
            label="Muscle groups"
            options={muscleGroupsOptions}
            helperText="You can select up to 10 muscle groups."
            multipleOptions={{
              min: 1,
              max: 10,
              formRef: form.ref,
              list: muscleGroupsList,
            }}
          />

          <SubmitButton text="Save changes" />
        </div>
      </Form>
    </div>
  );
}
