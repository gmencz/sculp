import { useFieldList, useForm } from "@conform-to/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { parse } from "@conform-to/zod";
import { SubmitButton } from "~/components/submit-button";
import { AppPageLayout } from "~/components/app-page-layout";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import type { MatchWithHeader } from "~/utils/hooks";
import { Heading } from "~/components/heading";

export const handle: MatchWithHeader = {
  header: () => "Create a new exercise",
  links: [],
};

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
  const lastSubmission = useActionData() as any;
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
      <Heading className="hidden text-zinc-900 dark:text-zinc-50 lg:block">
        Create a new exercise
      </Heading>

      <Form method="post" className="lg:mt-4" {...form.props}>
        <div className="flex flex-col gap-6">
          <Input
            config={name}
            label="Exercise name"
            autoComplete="exercise-name"
            placeholder="Chest Press, Lateral Raise..."
          />

          <Select
            config={muscleGroups}
            label="Muscle groups worked"
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
