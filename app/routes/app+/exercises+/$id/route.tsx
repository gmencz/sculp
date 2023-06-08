import { useFieldList, useForm } from "@conform-to/react";
import type {
  ActionArgs,
  LoaderArgs,
  SerializeFrom,
} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { parse } from "@conform-to/zod";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/utils/routes";
import { AppPageLayout } from "~/components/app-page-layout";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";
import type { MatchWithHeader } from "~/utils/hooks";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => data.exercise.name,
  links: [],
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

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

  if (existingExercise && name !== existingExercise.name) {
    submission.error["name"] = "An exercise with that name already exists.";
    return json(submission, { status: 400 });
  }

  const exercise = await prisma.exercise.findFirst({
    where: {
      AND: [{ id }, { userId: user.id }],
    },
    select: {
      id: true,
      muscleGroups: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!exercise) {
    throw new Response("Not found", { status: 404 });
  }

  const disconnectMuscleGroups = exercise.muscleGroups.filter(
    (muscleGroup) => !muscleGroups.includes(muscleGroup.name)
  );

  const updatedExercise = await prisma.exercise.update({
    where: {
      id: exercise.id,
    },
    data: {
      name,
      muscleGroups: {
        disconnect: disconnectMuscleGroups,
        connect: muscleGroups.map((name) => ({ name })),
      },
    },
    select: { id: true },
  });

  const updatedSession = await flashGlobalNotification(request, {
    type: "success",
    message: "The exercise has been updated.",
  });

  return redirect(configRoutes.app.exercises.view(updatedExercise.id), {
    headers: {
      "Set-Cookie": await commitSession(updatedSession),
    },
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const exercise = await prisma.exercise.findFirst({
    where: {
      AND: [{ id }, { userId: user.id }],
    },
    select: {
      id: true,
      name: true,
      muscleGroups: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!exercise) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const muscleGroups = await prisma.muscleGroup.findMany({
    select: {
      name: true,
    },
  });

  return json({
    exercise,
    muscleGroupsOptions: muscleGroups.map((m) => m.name),
  });
};

export default function Exercise() {
  const { exercise, muscleGroupsOptions } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData() as any;
  const [form, { name, muscleGroups }] = useForm<Schema>({
    id: "edit-exercise",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      name: exercise.name,
      muscleGroups: exercise.muscleGroups.map(
        (muscleGroup) => muscleGroup.name
      ),
    },
  });

  const muscleGroupsList = useFieldList(form.ref, muscleGroups);

  return (
    <AppPageLayout>
      <Form replace method="post" {...form.props}>
        <div className="flex flex-col gap-6">
          <Input
            config={name}
            label="Exercise name"
            autoComplete="exercise-name"
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

          <SubmitButton text="Save changes" />
        </div>
      </Form>
    </AppPageLayout>
  );
}
