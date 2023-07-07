import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
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
  addExerciseToSupersetSchema,
  addSetSchema,
  intentSchema,
  removeExerciseFromSupersetSchema,
  removeExerciseSchema,
  removeSetSchema,
  reorderExercisesSchema,
  updateExerciseNotesSchema,
  updateExerciseRestTimersSchema,
  updateRoutineDetailsSchema,
  updateRoutineSettingsSchema,
  updateSetSchema,
} from "./schema";
import { Intent as ExerciseIntent } from "~/routes/app+/exercises+/index/schema";
import { useEffect, useRef, useState } from "react";
import { useResetCallback } from "~/utils/hooks";
import { ExerciseOptionsModal } from "./exercise-options-modal";
import { Prisma } from "@prisma/client";
import { redirectBack } from "~/utils/responses.server";
import { ReorderExercisesModal } from "./reorder-exercises-modal";
import { Exercise } from "./exercise";
import { Cog6ToothIcon, PlusIcon } from "@heroicons/react/20/solid";
import { RoutineSettingsModal } from "./routine-settings-modal";
import { TrackRir } from "~/routes/app+/profile/schema";
import { SetModal } from "./set-modal";
import clsx from "clsx";
import { classes } from "~/utils/classes";
import { generateId } from "~/utils/ids";
import { RemoveExerciseModal } from "./remove-exercise-modal";
import { ExerciseRestTimerModal } from "./exercise-rest-timer-modal";
import { timeToSeconds } from "~/utils/strings";
import { AddExerciseToSupersetModal } from "./add-exercise-to-superset-modal";

const supersetsColorsArray = [
  "#9333ea",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#eab308",
  "#84cc16",
  "#f43f5e",
  "#4f46e5",
];

function getSupersetsColors(exercises: { superset: { id: string } | null }[]) {
  return exercises.reduce<Record<string, string>>((acc, exercise) => {
    if (!exercise.superset || acc[exercise.superset.id]) {
      return acc;
    }

    let color: string;
    const keysLength = Object.keys(acc).length;
    if (keysLength > supersetsColorsArray.length) {
      color =
        supersetsColorsArray[
          Math.floor(Math.random() * supersetsColorsArray.length)
        ];
    } else {
      color = supersetsColorsArray[keysLength];
    }

    return {
      ...acc,
      [exercise.superset.id]: color,
    };
  }, {});
}

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
          normalSetsRestTimerInSeconds: true,
          warmUpSetsRestTimerInSeconds: true,
          exercise: {
            select: {
              id: true,
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
            orderBy: { number: "asc" },
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

  let exercisesWithPreviousValues;
  if (routine.previousValuesFrom === "SAME_ROUTINE") {
    // If previous values from the same routine, fetch the previous training session using this routine.
    const previousTrainingSession = await prisma.trainingSession.findFirst({
      where: {
        routineId: routine.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        exercises: {
          select: {
            exerciseId: true,
            sets: {
              select: {
                id: true,
                number: true,
                reps: true,
                rir: true,
                weight: true,
                type: true,
              },
              orderBy: {
                number: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!previousTrainingSession) {
      exercisesWithPreviousValues = routine.exercises.map((exercise) => {
        return {
          ...exercise,
          previousSets: [],
        };
      });
    } else {
      exercisesWithPreviousValues = routine.exercises.map((exercise) => {
        const previousExercise = previousTrainingSession.exercises.find(
          (previousExercise) =>
            previousExercise.exerciseId === exercise.exercise.id
        );

        return {
          ...exercise,
          previousSets: previousExercise?.sets || [],
        };
      });
    }
  } else {
    // If previous values from any training session, fetch the previous training session exercise for each exercise
    // of this routine.
    exercisesWithPreviousValues = await Promise.all(
      routine.exercises.map(async (exercise) => {
        const previousExercise = await prisma.trainingSessionExercise.findFirst(
          {
            where: {
              AND: [
                { exerciseId: exercise.exercise.id },
                { trainingSession: { userId: user.id } },
              ],
            },
            orderBy: {
              trainingSession: {
                startedAt: "desc",
              },
            },
            select: {
              sets: {
                select: {
                  id: true,
                  number: true,
                  reps: true,
                  rir: true,
                  weight: true,
                  type: true,
                },
                orderBy: {
                  number: "asc",
                },
              },
            },
          }
        );

        return {
          ...exercise,
          previousSets: previousExercise?.sets || [],
        };
      })
    );
  }

  return json({
    routine: {
      ...routine,
      exercises: exercisesWithPreviousValues,
      supersetsColors: getSupersetsColors(exercisesWithPreviousValues),
    },
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

    case Intent.UPDATE_SET: {
      const submission = parse(formData, {
        schema: updateSetSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, weight, reps, rir, type } = submission.value;

      await prisma.routineExerciseSet.updateMany({
        where: {
          AND: [
            { routineExercise: { routineId: params.id } },
            { routineExercise: { routine: { userId: user.id } } },
            { id },
          ],
        },
        data: {
          weight: weight === undefined ? undefined : weight,
          reps: reps === undefined ? undefined : reps,
          rir: rir === undefined ? undefined : rir,
          type: type === undefined || type === null ? undefined : type,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.REMOVE_SET: {
      const submission = parse(formData, {
        schema: removeSetSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id } = submission.value;

      const setToDelete = await prisma.routineExerciseSet.findFirst({
        where: {
          AND: [
            { routineExercise: { routineId: params.id } },
            { routineExercise: { routine: { userId: user.id } } },
            { id },
          ],
        },
        select: {
          id: true,
          number: true,
        },
      });

      if (!setToDelete) {
        throw new Response("Not Found", { status: 404 });
      }

      const deletedSet = await prisma.routineExerciseSet.delete({
        where: {
          id: setToDelete.id,
        },
        select: {
          number: true,
        },
      });

      // Update the `number` value for the sets after the one we removed.
      await prisma.routineExerciseSet.updateMany({
        where: {
          AND: [
            { routineExercise: { routineId: params.id } },
            { routineExercise: { routine: { userId: user.id } } },
            { number: { gt: deletedSet.number } },
          ],
        },
        data: {
          number: { decrement: 1 },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.ADD_SET: {
      const submission = parse(formData, {
        schema: addSetSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { exerciseId } = submission.value;

      const lastSet = await prisma.routineExerciseSet.findFirst({
        where: {
          AND: [
            { routineExercise: { routineId: params.id } },
            { routineExercise: { routine: { userId: user.id } } },
            { routineExercise: { id: exerciseId } },
          ],
        },
        orderBy: {
          number: "desc",
        },
        select: {
          number: true,
          reps: true,
          rir: true,
          weight: true,
        },
      });

      if (lastSet) {
        await prisma.routineExerciseSet.create({
          data: {
            routineExercise: { connect: { id: exerciseId } },
            number: lastSet.number + 1,
            reps: lastSet.reps,
            rir: lastSet.rir,
            weight: lastSet.weight,
            type: "NORMAL",
          },
        });
      } else {
        await prisma.routineExerciseSet.create({
          data: {
            routineExercise: { connect: { id: exerciseId } },
            number: 1,
            type: "NORMAL",
          },
        });
      }

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.REMOVE_EXERCISE: {
      const submission = parse(formData, {
        schema: removeExerciseSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id } = submission.value;

      const exerciseToDelete = await prisma.routineExercise.findFirst({
        where: {
          AND: [
            { routineId: params.id },
            { routine: { userId: user.id } },
            { id },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!exerciseToDelete) {
        throw new Response("Not Found", { status: 404 });
      }

      const deletedExercise = await prisma.routineExercise.delete({
        where: {
          id: exerciseToDelete.id,
        },
        select: {
          order: true,
        },
      });

      // Update the `order` value for the exercises after the one we removed.
      await prisma.routineExercise.updateMany({
        where: {
          AND: [
            { routineId: params.id },
            { routine: { userId: user.id } },
            { order: { gt: deletedExercise.order } },
          ],
        },
        data: {
          order: { decrement: 1 },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.UPDATE_EXERCISE_NOTES: {
      const submission = parse(formData, {
        schema: updateExerciseNotesSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, notes } = submission.value;

      await prisma.routineExercise.updateMany({
        where: {
          AND: [
            { routineId: params.id },
            { routine: { userId: user.id } },
            { id },
          ],
        },
        data: {
          notes,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.UPDATE_EXERCISE_REST_TIMER: {
      const submission = parse(formData, {
        schema: updateExerciseRestTimersSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, normalRestTimer, warmUpRestTimer } = submission.value;

      let normalRestTimerSeconds: number | null = null;
      if (normalRestTimer !== "off") {
        normalRestTimerSeconds = timeToSeconds(normalRestTimer);
      }

      let warmUpRestTimerSeconds: number | null = null;
      if (warmUpRestTimer !== "off") {
        warmUpRestTimerSeconds = timeToSeconds(warmUpRestTimer);
      }

      await prisma.routineExercise.updateMany({
        where: {
          AND: [
            { routineId: params.id },
            { routine: { userId: user.id } },
            { id },
          ],
        },
        data: {
          normalSetsRestTimerInSeconds: normalRestTimerSeconds,
          warmUpSetsRestTimerInSeconds: warmUpRestTimerSeconds,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.ADD_EXERCISE_TO_SUPERSET: {
      const submission = parse(formData, {
        schema: addExerciseToSupersetSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, withId } = submission.value;

      const [exercise, withExercise] = await Promise.all([
        prisma.routineExercise.findFirst({
          where: {
            AND: [
              { routineId: params.id },
              { routine: { userId: user.id } },
              { id },
              { supersetId: null },
            ],
          },
          select: {
            id: true,
          },
        }),
        prisma.routineExercise.findFirst({
          where: {
            AND: [
              { routineId: params.id },
              { routine: { userId: user.id } },
              { id: withId },
            ],
          },
          select: {
            id: true,
            supersetId: true,
          },
        }),
      ]);

      if (!exercise || !withExercise) {
        throw new Response("Not Found", { status: 404 });
      }

      // If the exercise we're trying to superset with already belongs to a superset, make the exercise part of it
      if (withExercise.supersetId) {
        await prisma.routineSuperset.update({
          where: {
            id: withExercise.supersetId,
          },
          data: {
            exercises: {
              connect: {
                id: exercise.id,
              },
            },
          },
        });
      } else {
        await prisma.routineSuperset.create({
          data: {
            routine: { connect: { id: params.id! } },
            exercises: {
              connect: [{ id: exercise.id }, { id: withExercise.id }],
            },
          },
        });
      }

      return redirectBack(request, {
        fallback: configRoutes.app.editRoutine(params.id!),
      });
    }

    case Intent.REMOVE_EXERCISE_FROM_SUPERSET: {
      const submission = parse(formData, {
        schema: removeExerciseFromSupersetSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, supersetId } = submission.value;

      const superset = await prisma.routineSuperset.findFirst({
        where: {
          AND: [
            { routineId: params.id },
            { routine: { userId: user.id } },
            { id: supersetId },
          ],
        },
        select: {
          id: true,
          _count: { select: { exercises: true } },
        },
      });

      if (!superset) {
        throw new Response("Not Found", { status: 404 });
      }

      await prisma.routineSuperset.update({
        where: {
          id: superset.id,
        },
        data: {
          exercises:
            superset._count.exercises <= 2
              ? {
                  set: [],
                }
              : {
                  disconnect: { id },
                },
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
  normalSetsRestTimerInSeconds: number | null;
  warmUpSetsRestTimerInSeconds: number | null;
};

export type SelectedSet = {
  id: string;
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

  const [controlledSupersetsColors, setControlledSupersetsColors] = useState(
    routine.supersetsColors
  );

  const [showSetModal, setShowSetModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<SelectedSet | null>(null);

  const [showRoutineSettingsModal, setShowRoutineSettingsModal] =
    useState(false);

  const [showExerciseRestTimerModal, setShowExerciseRestTimerModal] =
    useState(false);

  const [showSortExercisesModal, setShowSortExercisesModal] = useState(false);

  const [showExerciseOptionsModal, setShowExerciseOptionsModal] =
    useState(false);

  const [showRemoveExerciseModal, setShowRemoveExerciseModal] = useState(false);
  const [showAddExerciseToSupersetModal, setShowAddExerciseToSupersetModal] =
    useState(false);

  const [selectedExercise, setSelectedExercise] =
    useState<SelectedExercise | null>(null);

  useResetCallback(routine.exercises, () => {
    setControlledExercises(routine.exercises);
  });

  useResetCallback(routine.supersetsColors, () => {
    setControlledSupersetsColors(routine.supersetsColors);
  });

  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.formData) {
      const intent = navigation.formData.get("intent");

      switch (intent) {
        case Intent.UPDATE_EXERCISE_REST_TIMER: {
          const id = navigation.formData.get("id") as string;
          const normalRestTimer = navigation.formData.get(
            "normalRestTimer"
          ) as string;
          const warmUpRestTimer = navigation.formData.get(
            "warmUpRestTimer"
          ) as string;
          if (id && normalRestTimer && warmUpRestTimer) {
            let normalRestTimerSeconds: number | null = null;
            if (normalRestTimer !== "off") {
              normalRestTimerSeconds = timeToSeconds(normalRestTimer);
            }

            let warmUpRestTimerSeconds: number | null = null;
            if (warmUpRestTimer !== "off") {
              warmUpRestTimerSeconds = timeToSeconds(warmUpRestTimer);
            }

            setControlledExercises((exercises) => {
              return exercises.map((exercise) => {
                if (exercise.id === id) {
                  return {
                    ...exercise,
                    normalSetsRestTimerInSeconds: normalRestTimerSeconds,
                    warmUpSetsRestTimerInSeconds: warmUpRestTimerSeconds,
                  };
                }

                return exercise;
              });
            });

            setShowExerciseRestTimerModal(false);
          }

          break;
        }

        case Intent.ADD_SET: {
          const exerciseId = navigation.formData.get("exerciseId") as string;
          if (exerciseId) {
            setControlledExercises((exercises) => {
              return exercises.map((exercise) => {
                if (exercise.id === exerciseId) {
                  const lastSet = exercise.sets.at(-1);
                  if (lastSet) {
                    return {
                      ...exercise,
                      sets: [
                        ...exercise.sets,
                        {
                          // Temporary client side id
                          id: `temp-new-${generateId()}`,
                          number: lastSet.number + 1,
                          reps: lastSet.reps,
                          weight: lastSet.weight,
                          rir: lastSet.rir,
                          type: "NORMAL",
                        },
                      ],
                    };
                  }

                  return {
                    ...exercise,
                    sets: [
                      ...exercise.sets,
                      {
                        // Temporary client side id
                        id: `temp-new-${generateId()}`,
                        number: 1,
                        reps: null,
                        rir: null,
                        weight: null,
                        type: "NORMAL",
                      },
                    ],
                  };
                }

                return exercise;
              });
            });
          }

          break;
        }

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

        case Intent.UPDATE_SET: {
          const result = parse(navigation.formData, {
            schema: updateSetSchema,
          });

          if (result.value) {
            const { id, weight, reps, rir, type } = result.value;

            setControlledExercises((exercises) => {
              return exercises.map((exercise) => {
                return {
                  ...exercise,
                  sets: exercise.sets.map((set) => {
                    if (set.id === id) {
                      const updatedSet = { ...set };

                      if (weight !== undefined) {
                        updatedSet.weight = weight;
                      }

                      if (reps !== undefined) {
                        updatedSet.reps = reps;
                      }

                      if (rir !== undefined) {
                        updatedSet.rir = rir;
                      }

                      if (type !== undefined && type !== null) {
                        updatedSet.type = type;
                      }

                      return updatedSet;
                    }

                    return set;
                  }),
                };
              });
            });

            setShowSetModal(false);
          }

          break;
        }

        case Intent.REMOVE_SET: {
          const id = navigation.formData.get("id") as string;
          if (id) {
            setControlledExercises((exercises) => {
              return exercises.map((exercise) => {
                return {
                  ...exercise,
                  sets: exercise.sets.filter((set) => set.id !== id),
                };
              });
            });

            setShowSetModal(false);
          }

          break;
        }

        case Intent.REMOVE_EXERCISE: {
          const id = navigation.formData.get("id") as string;
          if (id) {
            setControlledExercises((exercises) => {
              return exercises.filter((exercise) => exercise.id !== id);
            });

            setShowRemoveExerciseModal(false);
          }

          break;
        }

        case Intent.UPDATE_EXERCISE_NOTES: {
          const id = navigation.formData.get("id") as string;
          const notes = navigation.formData.get("notes") as string;
          if (id) {
            setControlledExercises((exercises) => {
              return exercises.map((exercise) => {
                if (exercise.id === id) {
                  return {
                    ...exercise,
                    notes: notes || "",
                  };
                }

                return exercise;
              });
            });

            setShowRemoveExerciseModal(false);
          }

          break;
        }

        case Intent.ADD_EXERCISE_TO_SUPERSET: {
          const id = navigation.formData.get("id") as string;
          const withId = navigation.formData.get("withId") as string;
          if (id && withId) {
            setControlledExercises((exercises) => {
              const withExercise = exercises.find(
                (exercise) => exercise.id === withId
              );

              if (withExercise) {
                if (withExercise.superset?.id) {
                  const exercisesInSuperset = exercises.filter(
                    (exercise) =>
                      exercise.superset?.id === withExercise.superset!.id
                  );

                  return exercises.map((exercise) => {
                    if (exercise.id === id) {
                      return {
                        ...exercise,
                        superset: {
                          id: withExercise.superset!.id,
                          exercises: exercisesInSuperset.map(
                            ({ id, order, exercise: innerExercise }) => ({
                              id,
                              order,
                              exercise: {
                                name: innerExercise.name,
                              },
                            })
                          ),
                        },
                      };
                    }

                    return exercise;
                  });
                } else {
                  const supersetId = `temp-new-${generateId()}`;

                  return exercises.map((exercise) => {
                    if (exercise.id === id || exercise.id === withId) {
                      return {
                        ...exercise,
                        superset: {
                          id: supersetId,
                          exercises: [
                            {
                              id: exercise.id,
                              order: exercise.order,
                              exercise: { name: exercise.exercise.name },
                            },
                            {
                              id: withExercise!.id,
                              order: withExercise!.order,
                              exercise: { name: withExercise!.exercise.name },
                            },
                          ],
                        },
                      };
                    }

                    return exercise;
                  });
                }
              }

              return exercises;
            });

            setShowAddExerciseToSupersetModal(false);
          }

          break;
        }

        case Intent.REMOVE_EXERCISE_FROM_SUPERSET: {
          const id = navigation.formData.get("id") as string;
          const supersetId = navigation.formData.get("supersetId") as string;
          if (id && supersetId) {
            setControlledExercises((exercises) => {
              const exercisesInSuperset = exercises.filter(
                (exercise) => exercise.superset?.id === supersetId
              );

              if (exercisesInSuperset.length <= 2) {
                return exercises.map((exercise) => {
                  if (exercise.superset?.id === supersetId) {
                    return {
                      ...exercise,
                      superset: null,
                    };
                  }

                  return exercise;
                });
              }

              return exercises.map((exercise) => {
                if (exercise.id === id) {
                  return {
                    ...exercise,
                    superset: null,
                  };
                }

                return exercise;
              });
            });

            setShowExerciseOptionsModal(false);
          }

          break;
        }
      }
    }
  }, [navigation.formData]);

  useEffect(() => {
    setControlledSupersetsColors(getSupersetsColors(controlledExercises));
  }, [controlledExercises]);

  const exercisesRef = useRef<Map<number, HTMLDivElement> | null>(null);

  const getMap = () => {
    if (!exercisesRef.current) {
      // Initialize the Map on first usage.
      exercisesRef.current = new Map();
    }
    return exercisesRef.current;
  };

  const [searchParams] = useSearchParams();
  const scrollToExerciseOrder = searchParams.get("scrollToExerciseOrder");

  useEffect(() => {
    if (scrollToExerciseOrder) {
      const map = getMap();
      const node = map.get(Number(scrollToExerciseOrder));
      node?.scrollIntoView();
    }
  }, [scrollToExerciseOrder]);

  return (
    <>
      <AppPageHeader
        goBackTo={
          routine.exercises.length > 0
            ? configRoutes.app.viewRoutine(routine.id)
            : configRoutes.app.home
        }
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
          {controlledExercises.length > 0 ? (
            <ol className="flex flex-col gap-8">
              {controlledExercises.map((exercise) => (
                <Exercise
                  ref={(node) => {
                    const map = getMap();
                    if (node) {
                      map.set(exercise.order, node);
                    } else {
                      map.delete(exercise.order);
                    }
                  }}
                  key={exercise.id}
                  supersetsColors={controlledSupersetsColors}
                  routine={controlledRoutine}
                  exercise={exercise}
                  setSelectedExercise={setSelectedExercise}
                  setShowExerciseOptionsModal={setShowExerciseOptionsModal}
                  setSelectedSet={setSelectedSet}
                  setShowSetModal={setShowSetModal}
                />
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 485.535 485.535"
                className="h-7 w-7 text-orange-500"
              >
                <g>
                  <g id="_x35__13_">
                    <g>
                      <path
                        d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
                      />
                      <path
                        d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
                      />
                      <path
                        d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
                      />
                    </g>
                  </g>
                </g>
              </svg>

              <p className="px-6">
                Get started by adding an exercise to your routine.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center px-4">
            <Link
              to={`${configRoutes.app.exercises}?intent=${ExerciseIntent.ADD_EXERCISE_TO_ROUTINE}&routineId=${routine.id}`}
              className={clsx(classes.buttonOrLink.primary, "w-full text-sm")}
            >
              <PlusIcon className="-ml-2 h-5 w-5" />
              <span>Add Exercise</span>
            </Link>
          </div>
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
        setShowRemoveExerciseModal={setShowRemoveExerciseModal}
        setShowExerciseRestTimerModal={setShowExerciseRestTimerModal}
        setShowAddExerciseToSupersetModal={setShowAddExerciseToSupersetModal}
      />

      <ReorderExercisesModal
        exercises={controlledExercises}
        show={showSortExercisesModal}
        setShow={setShowSortExercisesModal}
      />

      <SetModal
        selectedSet={selectedSet}
        show={showSetModal}
        setShow={setShowSetModal}
      />

      <RemoveExerciseModal
        show={showRemoveExerciseModal}
        setShow={setShowRemoveExerciseModal}
        selectedExercise={selectedExercise}
      />

      <ExerciseRestTimerModal
        show={showExerciseRestTimerModal}
        setShow={setShowExerciseRestTimerModal}
        selectedExercise={selectedExercise}
      />

      <AddExerciseToSupersetModal
        show={showAddExerciseToSupersetModal}
        setShow={setShowAddExerciseToSupersetModal}
        selectedExercise={selectedExercise}
        exercises={controlledExercises}
        supersetsColors={controlledSupersetsColors}
      />
    </>
  );
}
