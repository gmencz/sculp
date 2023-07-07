import { requestIntent, useForm, validate } from "@conform-to/react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { AppPageHeader } from "~/components/app-page-header";
import { AppPageLayout } from "~/components/app-page-layout";
import { Input } from "~/components/input";
import {
  addExerciseToRoutineSchema,
  Intent,
  intentSchema,
  replaceExerciseFromRoutineSchema,
  searchSchema,
  type SearchSchema,
} from "./schema";
import { parse } from "@conform-to/zod";
import { requireUser } from "~/services/auth/api/require-user";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import { toPostgresQuery } from "~/utils/strings";
import { prisma } from "~/utils/db.server";
import { useDebouncedSubmit } from "~/utils/hooks";
import { Card } from "~/components/card";
import { classes } from "~/utils/classes";
import { Exercise } from "./exercise";
import { AddExerciseToRoutineForm } from "./add-exercise-to-routine-form";
import { ReplaceExerciseFromRoutineForm } from "./replace-exercise-from-routine-form";
import { configRoutes } from "~/utils/routes";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (query) {
    const formData = new FormData();
    formData.set("query", query);
    const submission = parse(formData, { schema: searchSchema });
    if (!submission.value || submission.intent !== "submit") {
      return json(
        { exercises: [], noResults: false, submission },
        { status: 400 }
      );
    }
  }

  let formattedQuery;
  if (query) {
    formattedQuery = toPostgresQuery(query);
  }

  const exercises = await prisma.exercise.findMany({
    where: formattedQuery
      ? {
          AND: [
            {
              OR: [{ userId: user.id }, { shared: true }],
            },
            {
              OR: [
                { name: { search: formattedQuery } },
                {
                  primaryMuscleGroups: {
                    some: { name: { search: formattedQuery } },
                  },
                },
              ],
            },
          ],
        }
      : {
          OR: [{ userId: user.id }, { shared: true }],
        },
    select: {
      id: true,
      name: true,
      shared: true,
      primaryMuscleGroups: { select: { id: true, name: true } },
      otherMuscleGroups: { select: { id: true, name: true } },
      trainingSessionExercises: {
        select: {
          trainingSession: {
            select: {
              startedAt: true,
            },
          },
        },
        take: 1,
        orderBy: {
          trainingSession: {
            startedAt: "desc",
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  exercises.sort((exerciseA, exerciseB) => {
    const trainingSessionExerciseA = exerciseA.trainingSessionExercises.at(0);
    const trainingSessionExerciseB = exerciseB.trainingSessionExercises.at(0);

    if (
      trainingSessionExerciseA?.trainingSession?.startedAt &&
      trainingSessionExerciseB?.trainingSession?.startedAt
    ) {
      const dateA = new Date(
        trainingSessionExerciseA.trainingSession.startedAt
      );

      const dateB = new Date(
        trainingSessionExerciseB.trainingSession.startedAt
      );

      if (dateA < dateB) {
        return -1;
      }

      if (dateA > dateB) {
        return 1;
      }

      return 0;
    }

    if (
      !trainingSessionExerciseA?.trainingSession?.startedAt &&
      !trainingSessionExerciseB?.trainingSession?.startedAt
    ) {
      return 0;
    }

    if (
      !trainingSessionExerciseA?.trainingSession?.startedAt &&
      trainingSessionExerciseB?.trainingSession?.startedAt
    ) {
      return 1;
    }

    if (
      trainingSessionExerciseA?.trainingSession?.startedAt &&
      !trainingSessionExerciseB?.trainingSession?.startedAt
    ) {
      return -1;
    }

    return 0;
  });

  return json({
    exercises,
    noResults: exercises.length === 0 && Boolean(query),
    submission: null,
  });
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema: intentSchema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  switch (intentSubmission.value.intent) {
    case Intent.ADD_EXERCISE_TO_ROUTINE: {
      const submission = parse(formData, {
        schema: addExerciseToRoutineSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { routineId, exerciseId } = submission.value;

      const routine = await prisma.routine.findFirst({
        where: {
          AND: [{ userId: user.id }, { id: routineId }],
        },
        select: {
          id: true,
          exercises: {
            select: {
              order: true,
            },
            orderBy: {
              order: "desc",
            },
            take: 1,
          },
        },
      });

      if (!routine) {
        throw new Response("Not Found", { status: 404 });
      }

      const exercise = await prisma.exercise.findFirst({
        where: {
          AND: [
            { id: exerciseId },
            { OR: [{ userId: user.id }, { shared: true }] },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!exercise) {
        throw new Response("Not Found", { status: 404 });
      }

      const lastExercise = routine.exercises.at(-1);

      const newExercise = await prisma.routineExercise.create({
        data: {
          order: lastExercise ? lastExercise.order + 1 : 1,
          exercise: { connect: { id: exercise.id } },
          routine: { connect: { id: routine.id } },
          sets: {
            create: {
              number: 1,
              type: "NORMAL",
            },
          },
        },
        select: {
          order: true,
        },
      });

      return redirect(
        configRoutes.app.editRoutine(routine.id) +
          `?scrollToExerciseOrder=${newExercise.order}`
      );
    }

    case Intent.REPLACE_EXERCISE_FROM_ROUTINE: {
      const submission = parse(formData, {
        schema: replaceExerciseFromRoutineSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { routineId, exerciseId, replaceExerciseId } = submission.value;

      const routineExercise = await prisma.routineExercise.findFirst({
        where: {
          AND: [
            { routine: { userId: user.id } },
            { routineId },
            { id: replaceExerciseId },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!routineExercise) {
        throw new Response("Not Found", { status: 404 });
      }

      const exercise = await prisma.exercise.findFirst({
        where: {
          AND: [
            { id: exerciseId },
            { OR: [{ userId: user.id }, { shared: true }] },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!exercise) {
        throw new Response("Not Found", { status: 404 });
      }

      const updatedRoutineExercise = await prisma.routineExercise.update({
        where: {
          id: routineExercise.id,
        },
        data: {
          exercise: { connect: { id: exercise.id } },
          sets: {
            // Delete existing sets and create the first one since the old sets might not be applicable to the new exercise.
            deleteMany: {},
            create: {
              number: 1,
              type: "NORMAL",
            },
          },
        },
        select: {
          order: true,
        },
      });

      return redirect(
        configRoutes.app.editRoutine(routineId) +
          `?scrollToExerciseOrder=${updatedRoutineExercise.order}`
      );
    }
  }

  throw new Response("Bad Request", { status: 400 });
};

export default function Exercises() {
  const { exercises, submission, noResults } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [searchForm, { query: queryConfig }] = useForm<SearchSchema>({
    id: "search-exercises",
    defaultValue: {
      query: searchParams.get("query") ?? "",
    },
    lastSubmission: submission ?? undefined,
    onValidate({ formData }) {
      return parse(formData, { schema: searchSchema });
    },
  });

  const intent = searchParams.get("intent");

  const submit = useDebouncedSubmit(searchForm.ref.current, {
    preventScrollReset: true,
    delay: 500,
  });

  return (
    <>
      <AppPageHeader
        pageTitle="Exercises"
        navigationItems={[
          {
            name: "Create exercise",
            element: (
              <>
                <Link
                  to="./new"
                  className="-m-2 p-2 text-zinc-950 hover:text-zinc-900 dark:text-white dark:hover:text-zinc-50"
                >
                  <PlusIcon className="h-7 w-7" />
                  <span className="sr-only">Create</span>
                </Link>
              </>
            ),
          },
        ]}
      />

      <AppPageLayout>
        <Card>
          <Form method="get" onChange={submit} {...searchForm.props}>
            <input
              type="hidden"
              name="intent"
              value={searchParams.get("intent") || undefined}
            />
            <input
              type="hidden"
              name="routineId"
              value={searchParams.get("routineId") || undefined}
            />
            <input
              type="hidden"
              name="exerciseId"
              value={searchParams.get("exerciseId") || undefined}
            />

            <Input
              config={queryConfig}
              onChange={() => {
                requestIntent(
                  searchForm.ref.current,
                  validate(queryConfig.name)
                );
              }}
              hideLabel
              label="Search exercise"
              placeholder="Search exercise"
              icon={
                <MagnifyingGlassIcon className="h-5 w-5 text-zinc-700 dark:text-zinc-400" />
              }
            />
          </Form>

          {noResults ? (
            <div className="mt-6 text-center">
              <h3 className="text-lg font-medium">
                Can't find {searchParams.get("query")}
              </h3>

              <p className="mb-4 mt-2 text-zinc-700 dark:text-zinc-400">
                We don't have any exercises like that in our database yet.
              </p>

              <Link to="./new" className={classes.buttonOrLink.primary}>
                Create Custom Exercise
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <span className="text-zinc-700 dark:text-zinc-300">Recent</span>

              <div className="mt-4">
                {intent === Intent.ADD_EXERCISE_TO_ROUTINE ? (
                  <AddExerciseToRoutineForm exercises={exercises} />
                ) : intent === Intent.REPLACE_EXERCISE_FROM_ROUTINE ? (
                  <ReplaceExerciseFromRoutineForm exercises={exercises} />
                ) : (
                  <ul className="flex flex-col gap-8">
                    {exercises.map((exercise) => (
                      <li key={exercise.id}>
                        <Link
                          to={`./${exercise.id}`}
                          className="-m-2 flex items-center gap-4 p-2"
                        >
                          <Exercise exercise={exercise} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </AppPageLayout>
    </>
  );
}
