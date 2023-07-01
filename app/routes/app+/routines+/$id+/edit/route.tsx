import { useLoaderData, useNavigation } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { json, type LoaderArgs } from "@remix-run/server-runtime";
import { AppPageHeader } from "~/components/app-page-header";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import { parse } from "@conform-to/zod";
import { RoutineDetailsForm } from "./routine-details-form";
import {
  Intent,
  PreviousValuesFrom,
  intentSchema,
  reorderExercisesSchema,
  updateRoutineDetailsSchema,
  updateRoutineSettingsSchema,
} from "./schema";
import { useEffect, useState } from "react";
import { useResetCallback } from "~/utils/hooks";
import { ExerciseOptionsModal } from "./exercise-options-modal";
import { Prisma } from "@prisma/client";
import { redirectBack } from "~/utils/responses.server";
import { ReorderExercisesModal } from "./reorder-exercises-modal";
import { Exercise } from "./exercise";
import { Cog6ToothIcon } from "@heroicons/react/20/solid";
import { RoutineSettingsModal } from "./routine-settings-modal";
import { TrackRir } from "~/routes/app+/profile/schema";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request, {
    select: { weightUnitPreference: true },
  });

  const routine = await prisma.routine.findFirst({
    where: {
      AND: [{ userId: user.id }, { id: params.id }],
    },
    select: {
      id: true,
      name: true,
      notes: true,
      trackRir: true,
      previousValuesFrom: true,
      exercises: {
        select: {
          id: true,
          notes: true,
          exercise: {
            select: {
              name: true,
              primaryMuscleGroups: true,
              otherMuscleGroups: true,
            },
          },
          order: true,
          superset: {
            select: {
              id: true,
              exercises: {
                select: {
                  id: true,
                  exercise: {
                    select: {
                      name: true,
                    },
                  },
                  order: true,
                },
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
          sets: {
            select: {
              id: true,
              number: true,
              reps: true,
              rir: true,
              weight: true,
              type: true,
            },
          },
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

  return json({
    routine,
    weightUnitPreference: user.weightUnitPreference,
  });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema: intentSchema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  switch (intentSubmission.value.intent) {
    case Intent.UPDATE_ROUTINE_DETAILS: {
      const submission = parse(formData, {
        schema: updateRoutineDetailsSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      try {
        await prisma.routine.updateMany({
          where: {
            AND: [{ id: params.id }, { userId: user.id }],
          },
          data: {
            name: submission.value.name,
            notes: submission.value.notes,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            submission.error["name"] =
              "You already have a routine with this name";

            return json(submission, { status: 400 });
          }
        }
        throw e;
      }

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.REORDER_EXERCISES: {
      const submission = parse(formData, {
        schema: reorderExercisesSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { orderedExercisesIds } = submission.value;
      const currentOrderedExercises = await prisma.routineExercise.findMany({
        where: {
          routineId: params.id,
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
        },
      });

      const exercisesToUpdate = orderedExercisesIds.filter(
        (id, index) => currentOrderedExercises[index]?.id !== id
      );

      if (!exercisesToUpdate) {
        return redirectBack(request, {
          fallback: configRoutes.app.editRoutine(params.id!),
        });
      }

      await prisma.$transaction(
        exercisesToUpdate.map((id, index) =>
          prisma.routineExercise.update({
            where: {
              id,
            },
            data: {
              order: index + 1,
            },
          })
        )
      );

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.UPDATE_ROUTINE_SETTINGS: {
      const submission = parse(formData, {
        schema: updateRoutineSettingsSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { previousValuesFrom, trackRir } = submission.value;

      await prisma.routine.updateMany({
        where: {
          AND: [{ id: params.id }, { userId: user.id }],
        },
        data: {
          trackRir: trackRir === TrackRir.YES,
          previousValuesFrom:
            previousValuesFrom === PreviousValuesFrom.ANY
              ? "ANY"
              : "SAME_ROUTINE",
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }
  }

  throw new Response("Bad Request", { status: 400 });
};

export type SelectedExercise = {
  id: string;
  name: string;
  supersetId?: string | null;
};

export default function EditRoutine() {
  const { routine } = useLoaderData<typeof loader>();
  const [controlledRoutine, setControlledRoutine] = useState({
    name: routine.name,
    notes: routine.notes,
    trackRir: routine.trackRir,
    previousValuesFrom: routine.previousValuesFrom,
  });

  const [controlledExercises, setControlledExercises] = useState(
    routine.exercises
  );

  const [showRoutineSettingsModal, setShowRoutineSettingsModal] =
    useState(false);

  const [showSortExercisesModal, setShowSortExercisesModal] = useState(false);

  const [showExerciseOptionsModal, setShowExerciseOptionsModal] =
    useState(false);

  const [selectedExercise, setSelectedExercise] =
    useState<SelectedExercise | null>(null);

  useResetCallback(routine.exercises, () => {
    setControlledExercises(routine.exercises);
  });

  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.formData) {
      const intent = navigation.formData.get("intent");

      switch (intent) {
        case Intent.UPDATE_ROUTINE_DETAILS: {
          const name = (navigation.formData.get("name") as string) || "";
          const notes = (navigation.formData.get("notes") as string) || "";
          setControlledRoutine((controlledRoutine) => ({
            ...controlledRoutine,
            name,
            notes,
          }));
          break;
        }

        case Intent.REORDER_EXERCISES: {
          const result = parse(navigation.formData, {
            schema: reorderExercisesSchema,
          });

          if (result.value) {
            const { orderedExercisesIds } = result.value;
            setControlledExercises((controlledExercises) => {
              return controlledExercises
                .map((exercise, index) => {
                  const orderIndex = orderedExercisesIds.findIndex(
                    (id) => id === exercise.id
                  );

                  return {
                    ...exercise,
                    order: orderIndex !== -1 ? orderIndex + 1 : exercise.order,
                  };
                })
                .sort((a, b) => a.order - b.order);
            });

            setShowSortExercisesModal(false);
          }

          break;
        }

        case Intent.UPDATE_ROUTINE_SETTINGS: {
          const result = parse(navigation.formData, {
            schema: updateRoutineSettingsSchema,
          });

          if (result.value) {
            const { trackRir, previousValuesFrom } = result.value;
            setControlledRoutine((controlledRoutine) => ({
              ...controlledRoutine,
              trackRir: trackRir === TrackRir.YES,
              previousValuesFrom:
                previousValuesFrom === PreviousValuesFrom.ANY
                  ? "ANY"
                  : "SAME_ROUTINE",
            }));

            setShowRoutineSettingsModal(false);
          }

          break;
        }
      }
    }
  }, [navigation.formData]);

  return (
    <>
      <AppPageHeader
        goBackTo={configRoutes.app.viewRoutine(routine.id)}
        pageTitle="Edit Routine"
        navigationItems={[
          {
            name: "Routine settings",
            element: (
              <>
                <button
                  className="-m-2 p-2 text-zinc-950 hover:text-zinc-900 dark:text-white dark:hover:text-zinc-50"
                  onClick={() => setShowRoutineSettingsModal(true)}
                >
                  <Cog6ToothIcon className="h-6 w-6" />
                  <span className="sr-only">Routine settings</span>
                </button>
              </>
            ),
          },
        ]}
      />

      <AppPageLayout>
        <Card>
          <RoutineDetailsForm routine={controlledRoutine} />
        </Card>

        <Card className="!px-0">
          <ol className="flex flex-col gap-8">
            {controlledExercises.map((exercise) => (
              <Exercise
                key={exercise.id}
                routine={controlledRoutine}
                exercise={exercise}
                setSelectedExercise={setSelectedExercise}
                setShowExerciseOptionsModal={setShowExerciseOptionsModal}
              />
            ))}
          </ol>
        </Card>
      </AppPageLayout>

      <RoutineSettingsModal
        routine={controlledRoutine}
        show={showRoutineSettingsModal}
        setShow={setShowRoutineSettingsModal}
      />

      <ExerciseOptionsModal
        selectedExercise={selectedExercise}
        show={showExerciseOptionsModal}
        setShow={setShowExerciseOptionsModal}
        setShowSortExercisesModal={setShowSortExercisesModal}
      />

      <ReorderExercisesModal
        exercises={controlledExercises}
        show={showSortExercisesModal}
        setShow={setShowSortExercisesModal}
      />
    </>
  );
}
