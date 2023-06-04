import { useFieldList, useForm } from "@conform-to/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Heading } from "~/components/heading";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { parse } from "@conform-to/zod";
import { SubmitButton } from "~/components/submit-button";
import { Paragraph } from "~/components/paragraph";
import { AppPageLayout } from "~/components/app-page-layout";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { name, muscleGroups } = submission.value;

  const existingExercise = await prisma.exercise.findUnique({
    where: {
      name_userId: {
        name,
        userId: user.id,
      },
    },
    select: {
      name: true,
    },
  });

  if (existingExercise) {
    submission.error["name"] = "An exercise with that name already exists.";
    return json(submission, { status: 400 });
  }

  await prisma.exercise.create({
    data: {
      name,
      userId: user.id,
      muscleGroups: {
        connect: muscleGroups.map((name) => ({ name })),
      },
    },
    select: { id: true },
  });

  return redirect(configRoutes.app.exercises.list);
};

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  const muscleGroups = await prisma.muscleGroup.findMany({
    select: {
      name: true,
    },
  });

  return json({
    muscleGroupsOptions: muscleGroups.map((m) => m.name),
  });
};

export default function Exercise() {
  const { muscleGroupsOptions } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData();
  const [form, { name, muscleGroups }] = useForm<Schema>({
    id: "new-exercise",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      muscleGroups: [],
    },
  });

  const muscleGroupsList = useFieldList(form.ref, muscleGroups);

  return (
    <AppPageLayout>
      <Heading>New exercise</Heading>
      <Paragraph>
        On this page you can create a new exercise which you will be able to add
        to your mesocycles.
      </Paragraph>

      <Form
        method="post"
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
        {...form.props}
      >
        <div className="flex flex-col gap-6 px-4 py-6 sm:p-8">
          <Input
            config={name}
            label="How is this exercise called?"
            autoComplete="exercise-name"
            placeholder="Chest Press, Lateral Raise..."
          />

          <Select
            config={muscleGroups}
            label="Which muscle groups does this exercise work?"
            options={muscleGroupsOptions}
            helperText="You can select up to 10 muscle groups."
            multipleOptions={{
              min: 1,
              max: 10,
              formRef: form.ref,
              list: muscleGroupsList,
            }}
          />

          <SubmitButton text="Save and continue" />
        </div>
      </Form>
    </AppPageLayout>
  );
}
