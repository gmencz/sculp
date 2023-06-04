import { useFieldList, useForm } from "@conform-to/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { Schema } from "./schema";
import { schema } from "./schema";
import {
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { Heading } from "~/components/heading";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { parse } from "@conform-to/zod";
import { SubmitButton } from "~/components/submit-button";
import { Paragraph } from "~/components/paragraph";
import { toast } from "react-hot-toast";
import { SuccessToast } from "~/components/success-toast";
import { configRoutes } from "~/utils/routes";
import { AppPageLayout } from "~/components/app-page-layout";
import { BackLink } from "~/components/back-link";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import { generateId } from "~/utils/ids";
import { useAfterPaintEffect } from "~/utils/hooks";

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

  const url = new URL(request.url);

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

  url.searchParams.set("success_id", generateId());
  return redirect(
    configRoutes.app.exercises.view(updatedExercise.id) + url.search
  );
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
  const [searchParams] = useSearchParams();

  const { exercise, muscleGroupsOptions } = useLoaderData<typeof loader>();

  const lastSubmission = useActionData();

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

  const successId = searchParams.get("success_id");
  useAfterPaintEffect(() => {
    if (successId) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success"
            description="Your changes have been saved."
          />
        ),
        { duration: 3000, position: "bottom-center", id: successId }
      );
    }
  }, [successId]);

  return (
    <AppPageLayout>
      <div className="mb-4 sm:hidden">
        <BackLink to={configRoutes.app.exercises.list}>Go back</BackLink>
      </div>

      <div>
        <Heading>Edit exercise</Heading>
        <Paragraph>
          On this page you can edit the exercise's name and the muscle groups
          worked.
        </Paragraph>
      </div>

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

          <SubmitButton text="Save changes" />
        </div>
      </Form>
    </AppPageLayout>
  );
}
