import { parse } from "@conform-to/zod";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { Prisma } from "@prisma/client";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";
import { configRoutes } from "~/utils/routes";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useFieldList, useForm } from "@conform-to/react";
import { AppPageHeader } from "~/components/app-page-header";
import { Card } from "~/components/card";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import clsx from "clsx";
import { classes } from "~/utils/classes";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);

  const exercise = await prisma.exercise.findFirst({
    where: {
      AND: [{ id: params.id }, { userId: user.id }, { shared: false }],
    },
    select: {
      name: true,
      primaryMuscleGroups: {
        select: {
          name: true,
        },
      },
      otherMuscleGroups: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!exercise) {
    throw new Response("Not Found", { status: 404 });
  }

  const muscleGroups = await prisma.muscleGroup.findMany({
    select: {
      name: true,
    },
  });

  return json({
    exercise,
    muscleGroups: muscleGroups.map((muscleGroup) => muscleGroup.name),
  });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { name, primaryMuscleGroups, otherMuscleGroups } = submission.value;

  try {
    const exercise = await prisma.exercise.findFirst({
      where: {
        AND: [{ id: params.id }, { userId: user.id }, { shared: false }],
      },
      select: {
        id: true,
        primaryMuscleGroups: {
          select: {
            name: true,
          },
        },
        otherMuscleGroups: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!exercise) {
      throw new Response("Not Found", { status: 404 });
    }

    await prisma.exercise.update({
      where: {
        id: exercise.id,
      },
      data: {
        name,
        primaryMuscleGroups: {
          disconnect: exercise.primaryMuscleGroups.map((muscleGroup) => ({
            name: muscleGroup.name,
          })),
          connect: primaryMuscleGroups.map((muscleGroup) => ({
            name: muscleGroup,
          })),
        },
        otherMuscleGroups: otherMuscleGroups?.length
          ? {
              disconnect: exercise.otherMuscleGroups.map((muscleGroup) => ({
                name: muscleGroup.name,
              })),
              connect: otherMuscleGroups.map((muscleGroup) => ({
                name: muscleGroup,
              })),
            }
          : undefined,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        submission.error["name"] =
          "There's already an exercise with that name in our database.";

        return json(submission, { status: 400 });
      }
    }

    throw e;
  }

  const session = await flashGlobalNotification(request, {
    message: "Exercise successfully updated!",
    type: "success",
  });

  return redirect(configRoutes.app.exercises, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function NewExercise() {
  const { muscleGroups, exercise } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, { name, primaryMuscleGroups, otherMuscleGroups }] =
    useForm<Schema>({
      id: "edit-exercise",
      lastSubmission,
      defaultValue: {
        name: exercise.name,
        primaryMuscleGroups: exercise.primaryMuscleGroups.map(
          (muscleGroup) => muscleGroup.name
        ),
        otherMuscleGroups: exercise.otherMuscleGroups.map(
          (muscleGroup) => muscleGroup.name
        ),
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  const primaryMuscleGroupsList = useFieldList(form.ref, primaryMuscleGroups);
  const otherMuscleGroupsList = useFieldList(form.ref, otherMuscleGroups);

  return (
    <>
      <AppPageHeader
        goBackTo={configRoutes.app.exercises}
        pageTitle={exercise.name}
      />

      <Card>
        <Form replace method="post" {...form.props}>
          <Input config={name} label="Name" hideLabel placeholder="Add Name" />

          <div className="mt-4">
            <Select
              config={primaryMuscleGroups}
              label="Primary Muscle Group"
              hideLabel
              options={muscleGroups}
              multipleOptions={{
                emptyOption: "Primary Muscle Groups",
                formRef: form.ref,
                min: 1,
                max: muscleGroups.length,
                list: primaryMuscleGroupsList,
              }}
            />
          </div>

          <div className="mt-4">
            <Select
              config={otherMuscleGroups}
              label="Other Muscle Groups (optional)"
              hideLabel
              options={muscleGroups}
              multipleOptions={{
                emptyOption: "Other Muscle Groups (optional)",
                formRef: form.ref,
                min: 1,
                max: muscleGroups.length,
                list: otherMuscleGroupsList,
              }}
            />
          </div>

          <button
            type="submit"
            className={clsx(classes.buttonOrLink.primary, "mt-6 w-full")}
          >
            Update
          </button>
        </Form>
      </Card>
    </>
  );
}
