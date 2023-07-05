import { parse } from "@conform-to/zod";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  json,
  type ActionArgs,
  type LoaderArgs,
  redirect,
} from "@remix-run/server-runtime";
import { AppPageHeader } from "~/components/app-page-header";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { configRoutes } from "~/utils/routes";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { useFieldList, useForm } from "@conform-to/react";
import { Input } from "~/components/input";
import { prisma } from "~/utils/db.server";
import { Select } from "~/components/select";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { Prisma } from "@prisma/client";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);

  const muscleGroups = await prisma.muscleGroup.findMany({
    select: {
      name: true,
    },
  });

  return json({
    muscleGroups: muscleGroups.map((muscleGroup) => muscleGroup.name),
  });
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { name, primaryMuscleGroup, otherMuscleGroups } = submission.value;

  try {
    await prisma.exercise.create({
      data: {
        shared: false,
        name,
        user: { connect: { id: user.id } },
        primaryMuscleGroups: {
          connect: { name: primaryMuscleGroup },
        },
        otherMuscleGroups: otherMuscleGroups?.length
          ? {
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
    message: "Exercise successfully created!",
    type: "success",
  });

  return redirect(configRoutes.app.exercises, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function NewExercise() {
  const { muscleGroups } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, { name, primaryMuscleGroup, otherMuscleGroups }] =
    useForm<Schema>({
      id: "new-exercise",
      lastSubmission,
      defaultValue: {
        otherMuscleGroups: [],
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  const otherMuscleGroupsList = useFieldList(form.ref, otherMuscleGroups);

  return (
    <>
      <AppPageHeader
        goBackTo={configRoutes.app.exercises}
        pageTitle="New Exercise"
      />

      <Card>
        <Form replace method="post" {...form.props}>
          <Input config={name} label="Name" hideLabel placeholder="Add Name" />

          <div className="mt-4">
            <Select
              config={primaryMuscleGroup}
              label="Primary Muscle Group"
              emptyOption="Primary Muscle Group"
              hideLabel
              options={muscleGroups}
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
            Save
          </button>
        </Form>
      </Card>
    </>
  );
}
