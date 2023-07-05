import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { Link, useLoaderData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { json, redirect, type LoaderArgs } from "@remix-run/server-runtime";
import clsx from "clsx";
import { useState } from "react";
import { AppPageHeader } from "~/components/app-page-header";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { classes } from "~/utils/classes";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import { RoutineOptionsModal } from "./routine-options-modal";
import { DeleteRoutineModal } from "./delete-routine-modal";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";
import { differenceInDays } from "date-fns";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const routine = await prisma.routine.findFirst({
    where: {
      AND: [{ userId: user.id }, { id: params.id }],
    },
    select: {
      id: true,
      name: true,
      exercises: {
        select: {
          id: true,
          exercise: {
            select: {
              name: true,
              primaryMuscleGroups: true,
              otherMuscleGroups: true,
            },
          },
          order: true,
          _count: { select: { sets: true } },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!routine) {
    throw new Response("Not Found", { status: 404 });
  }

  const lastTrainingSession = await prisma.trainingSession.findFirst({
    where: {
      AND: [{ userId: user.id }, { routineId: routine.id }],
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      id: true,
      startedAt: true,
    },
  });

  return json({ routine: { ...routine, lastTrainingSession } });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);

  if (request.method === "DELETE") {
    await prisma.routine.deleteMany({
      where: {
        AND: [{ id: params.id }, { userId: user.id }],
      },
    });

    const session = await flashGlobalNotification(request, {
      message: "Routine successfully deleted!",
      type: "success",
    });

    return redirect(configRoutes.app.home, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  throw new Response("Method Not Allowed", { status: 405 });
};

export default function ViewRoutine() {
  const { routine } = useLoaderData<typeof loader>();
  const [showRoutineOptionsModal, setShowRoutineOptionsModal] = useState(false);
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);

  return (
    <>
      <AppPageHeader
        goBackTo={configRoutes.app.home}
        pageTitle={routine.name}
        navigationItems={[
          {
            name: "Routine options",
            element: (
              <>
                <button
                  className="-m-2 p-2 text-zinc-950 hover:text-zinc-900 dark:text-white dark:hover:text-zinc-50"
                  onClick={() => setShowRoutineOptionsModal(true)}
                >
                  <EllipsisVerticalIcon className="h-6 w-6" />
                  <span className="sr-only">Routine options</span>
                </button>
              </>
            ),
          },
        ]}
      />

      <AppPageLayout>
        <Card>
          {routine.lastTrainingSession ? (
            <p className="mb-6 text-zinc-700 dark:text-zinc-300">
              Last performed:{" "}
              {differenceInDays(
                new Date(),
                new Date(routine.lastTrainingSession.startedAt)
              )}{" "}
              days ago
            </p>
          ) : null}

          <ol className="flex flex-col gap-6">
            {routine.exercises.map((exercise) => (
              <li key={exercise.id}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl font-medium uppercase dark:bg-zinc-800">
                    {exercise.exercise.name.charAt(0)}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {exercise._count.sets} x {exercise.exercise.name}
                    </span>

                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      <span>
                        {exercise.exercise.primaryMuscleGroups
                          .map((muscleGroup) => muscleGroup.name)
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <Link
            className={clsx(classes.buttonOrLink.primary, "mt-8 w-full")}
            to={configRoutes.app.trainWithRoutine(routine.id)}
          >
            Start Routine
          </Link>
        </Card>
      </AppPageLayout>

      <RoutineOptionsModal
        routine={routine}
        setShow={setShowRoutineOptionsModal}
        show={showRoutineOptionsModal}
        setShowDeleteRoutineModal={setShowDeleteRoutineModal}
      />

      <DeleteRoutineModal
        routine={routine}
        show={showDeleteRoutineModal}
        setShow={setShowDeleteRoutineModal}
      />
    </>
  );
}
