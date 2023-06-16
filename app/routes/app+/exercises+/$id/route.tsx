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
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const exercise = await prisma.exercise.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      shared: true,
      muscleGroups: {
        select: {
          id: true,
          name: true,
        },
      },
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

  const allTimeHeaviestSet =
    await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.findFirst({
      where: {
        AND: [{ completed: true }, { exercise: { exerciseId: exercise.id } }],
      },
      orderBy: [{ weight: "desc" }, { repsCompleted: "desc" }],
      select: {
        repsCompleted: true,
        weight: true,
        exercise: {
          select: {
            trainingDay: {
              select: {
                date: true,
              },
            },
          },
        },
      },
    });

  const performances =
    await prisma.mesocycleRunMicrocycleTrainingDayExercise.findMany({
      where: {
        AND: [
          { exerciseId: exercise.id },
          { sets: { every: { completed: true } } },
        ],
      },
      select: {
        id: true,
        trainingDay: {
          select: {
            date: true,
          },
        },
        sets: {
          select: {
            id: true,
            weight: true,
            repsCompleted: true,
            number: true,
          },
          orderBy: {
            number: "asc",
          },
        },
      },
    });

  const totals = performances
    .flatMap((performance) => performance.sets)
    .reduce(
      (acc, curr) => {
        return {
          volume: acc.volume + (curr.weight || 0) * (curr.repsCompleted || 0),
          reps: acc.reps + (curr.repsCompleted || 0),
        };
      },
      {
        volume: 0,
        reps: 0,
      }
    );

  return json({
    exercise: {
      ...exercise,
      performances: performances.map((performance) => {
        const volume = performance.sets.reduce(
          (acc, curr) => acc + (curr.weight || 0) * (curr.repsCompleted || 0),
          0
        );

        return {
          id: performance.id,
          volume,
          sets: performance.sets,
          formattedShortDate: format(
            new Date(performance.trainingDay!.date),
            "d'.'M'.'yy"
          ),
          formattedDate: format(
            new Date(performance.trainingDay!.date),
            "MMMM' 'd' 'yyyy"
          ),
        };
      }),
      stats: {
        allTimeHeaviestSet,
        totals,
      },
    },
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

  const { allTimeHeaviestSet, totals } = exercise.stats;

  const stats = [
    {
      name: "All-time heaviest set",
      stat: allTimeHeaviestSet
        ? `${allTimeHeaviestSet.weight}x${allTimeHeaviestSet.repsCompleted}`
        : "No data",
      helperText: allTimeHeaviestSet
        ? `${format(
            new Date(allTimeHeaviestSet.exercise!.trainingDay!.date),
            "MMMM' 'd' 'yyyy"
          )}`
        : null,
    },
    { name: "Total reps", stat: totals.reps },
    { name: "Total volume", stat: totals.volume },
  ];

  return (
    <AppPageLayout>
      {exercise.shared ? (
        <>
          <Heading className="hidden text-zinc-900 lg:block">
            {exercise.name}
          </Heading>

          <Paragraph className="mt-1">
            This exercise can't be edited because it's shared by all Sculped
            users.
          </Paragraph>
        </>
      ) : (
        <>
          <Heading className="hidden text-zinc-900 lg:block">
            {exercise.name}
          </Heading>

          <Form className="lg:mt-4" replace method="post" {...form.props}>
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
            </div>
          </Form>
        </>
      )}

      <div className="mt-6">
        <h3 className="text-base font-semibold leading-6 text-zinc-900">
          Stats
        </h3>
        <dl className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.name} className="overflow-hidden">
              <dt className="truncate text-sm font-medium text-zinc-700">
                {item.name}
              </dt>
              <dd className="mt-2 flex items-baseline text-3xl font-semibold text-zinc-900">
                <span className="tracking-tight text-orange-500">
                  {item.stat}
                </span>
                {item.helperText ? (
                  <span className="ml-2 text-sm font-medium text-zinc-500">
                    {item.helperText}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12">
          <h3 className="text-base font-semibold leading-6 text-zinc-900">
            Volume graph
          </h3>

          {exercise.performances.length > 0 ? (
            <ResponsiveContainer className="mt-6" width="100%" height={200}>
              <LineChart data={exercise.performances}>
                <CartesianGrid strokeDasharray="3 3" fill="#fafafa" />
                <Line type="monotone" dataKey="volume" stroke="#f97316" />
                <YAxis
                  dx={-20}
                  tickLine={{ stroke: "#f97316" }}
                  axisLine={{ stroke: "#e4e4e7" }}
                  tick={{ fill: "#71717a", fontSize: "0.875rem" }}
                />
                <XAxis
                  dataKey="formattedShortDate"
                  dy={10}
                  tickLine={{ stroke: "#f97316" }}
                  axisLine={{ stroke: "#e4e4e7" }}
                  tick={{ fill: "#71717a", fontSize: "0.875rem" }}
                />
                <Tooltip
                  separator=": "
                  labelClassName="text-zinc-500"
                  wrapperClassName="text-sm font-medium rounded-xl shadow-lg bg-white ring-1 ring-zinc-900/5 flex flex-col gap-1"
                  contentStyle={{ border: "none" }}
                  itemStyle={{
                    margin: 0,
                    padding: 0,
                    fontFamily:
                      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji","Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji"',
                  }}
                  formatter={(value, name, item) => {
                    return [value, "Volume"];
                  }}
                  labelFormatter={(label, item) => {
                    if (!item[0]) return label;
                    return item[0].payload.formattedDate;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Paragraph className="mt-2">No data</Paragraph>
          )}
        </div>

        <div className="mt-12">
          <h3 className="text-base font-semibold leading-6 text-zinc-900">
            History
          </h3>

          {exercise.performances.length > 0 ? (
            <div className="-mx-4 mt-4 sm:-mx-0">
              <table className="min-w-full divide-y divide-zinc-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-0"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                    >
                      Sets
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {exercise.performances.map((performance) => (
                    <tr key={performance.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 align-baseline text-sm font-medium text-zinc-900 sm:pl-0">
                        {performance.formattedDate}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 align-baseline text-sm text-zinc-500">
                        {performance.sets.map((set, index) => (
                          <span className="block" key={set.id}>
                            {set.number} - {set.weight}x{set.repsCompleted}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Paragraph className="mt-2">No data</Paragraph>
          )}
        </div>
      </div>

      {exercise.shared ? null : (
        <div className="mt-8 flex items-center border-t border-zinc-200 pt-6 sm:justify-start">
          <SubmitButton
            form={form.id}
            text="Save changes"
            className="w-full sm:w-auto"
          />
        </div>
      )}
    </AppPageLayout>
  );
}
