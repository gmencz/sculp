import { useLoaderData } from "@remix-run/react";
import type {
  ActionArgs,
  LoaderArgs,
  SerializeFrom,
} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  differenceInDays,
  format,
  isAfter,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  startOfToday,
} from "date-fns";
import { CurrentMesocycleNotFound } from "./current-mesocycle-not-found";
import { CurrentMesocycleStartsInTheFuture } from "./current-mesocycle-starts-in-the-future";
import { parse } from "@conform-to/zod";
import {
  addSetSchema,
  finishOrUpdateSessionSchema,
  schema,
  updateExerciseSchema,
  updateSetSchema,
} from "./schema";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import { DayPlan } from "./day-plan";
import { redirectBack } from "~/utils/responses.server";
import { requireUser } from "~/services/auth/api/require-user";
import { getSessionFromCookie } from "~/utils/session.server";
import {
  getMesocycleRunCalendarDays,
  getMesocycleRunDayByDate,
} from "~/utils/mesocycles.server";
import { commitSession } from "~/utils/session.server";
import { generateId } from "~/utils/ids";
import type { MatchWithHeader } from "~/utils/hooks";

export enum CurrentMesocycleState {
  NOT_FOUND,
  STARTS_IN_THE_FUTURE,
  STARTED,
}

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => {
    if (data.state !== CurrentMesocycleState.STARTED) {
      return "Current mesocycle";
    }

    const date = new Date(data.date);
    if (isToday(date)) {
      return "Today";
    }

    if (isTomorrow(date)) {
      return "Tomorrow";
    }

    if (isYesterday(date)) {
      return "Yesterday";
    }

    return format(date, "MMMM' 'd' 'yyyy");
  },

  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  let state: CurrentMesocycleState;
  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: {
      id: true,
      previousRun: {
        select: {
          id: true,
        },
      },
      startDate: true,
      endDate: true,
      mesocycle: {
        select: {
          id: true,
          weightUnitPreference: true,
          name: true,
          microcycles: true,
          restDays: true,
          _count: { select: { trainingDays: true } },
        },
      },
      microcycles: {
        select: {
          restDays: true,
          trainingDays: {
            orderBy: {
              number: "asc",
            },
            select: {
              id: true,
              number: true,
              date: true,
            },
          },
        },
      },
    },
  });

  if (!currentMesocycle) {
    state = CurrentMesocycleState.NOT_FOUND;

    return json({
      state,
      mesocyclesCount: await prisma.mesocycle.count({
        where: {
          userId: user.id,
        },
      }),
    });
  }

  const today = startOfToday();

  // The user starts the mesocycle some time in the future.
  if (isAfter(currentMesocycle.startDate, today)) {
    const daysDifference = differenceInDays(currentMesocycle.startDate, today);
    let formattedStartDate;
    if (daysDifference === 1) {
      formattedStartDate = "tomorrow";
    } else {
      formattedStartDate = `on the ${format(
        currentMesocycle.startDate,
        "do' of 'MMMM'"
      )} (in ${daysDifference} days)`;
    }

    state = CurrentMesocycleState.STARTS_IN_THE_FUTURE;
    return json({
      state,
      formattedStartDate,
      weightUnitPreference: currentMesocycle.mesocycle.weightUnitPreference,
      mesocycleName: currentMesocycle.mesocycle.name,
    });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  let date: Date;
  if (dateParam) {
    date = new Date(decodeURIComponent(dateParam));
  } else {
    date = today;
  }

  const microcycleLength =
    currentMesocycle.mesocycle._count.trainingDays +
    currentMesocycle.mesocycle.restDays.length;

  const calendarDays = getMesocycleRunCalendarDays(
    {
      startDate: currentMesocycle.startDate,
      endDate: currentMesocycle.endDate,
      microcycles: currentMesocycle.microcycles,
      microcycleLength,
    },
    date
  );

  const day = getMesocycleRunDayByDate(
    {
      startDate: currentMesocycle.startDate,
      endDate: currentMesocycle.endDate,
      microcycles: currentMesocycle.microcycles,
      microcycleLength,
    },
    date
  );

  const session = await getSessionFromCookie(request);

  const trainingDaySessionUpdated = ((await session.get(
    "trainingDaySessionUpdated"
  )) || null) as string | null;

  const trainingDaySessionFinished = ((await session.get(
    "trainingDaySessionFinished"
  )) || null) as string | null;

  const isFutureSession = isAfter(date, today);
  state = CurrentMesocycleState.STARTED;
  if (day?.trainingDay?.id) {
    const trainingDayData =
      await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
        where: { id: day.trainingDay.id },
        select: {
          id: true,
          completed: true,
          label: true,
          number: true,
          date: true,
          feedback: true,
          exercises: {
            orderBy: {
              number: "asc",
            },
            select: {
              id: true,
              notes: true,
              number: true,
              exercise: {
                select: {
                  id: true,
                  name: true,
                  notes: true,
                  muscleGroups: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              sets: {
                orderBy: {
                  number: "asc",
                },
                select: {
                  id: true,
                  number: true,
                  completed: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                  repsCompleted: true,
                  rir: true,
                  weight: true,
                },
              },
            },
          },
        },
      });

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    const previousTrainingDay =
      await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
        where: {
          microcycle: {
            mesocycleRunId: currentMesocycle.id,
          },
          number: trainingDayData.number,
          completed: true,
          date: {
            lt: trainingDayData.date,
          },
        },
        orderBy: {
          date: "desc",
        },
        select: {
          exercises: {
            select: {
              exerciseId: true,
              number: true,
              sets: {
                orderBy: {
                  number: "asc",
                },
                select: {
                  id: true,
                  number: true,
                  completed: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                  repsCompleted: true,
                  rir: true,
                  weight: true,
                },
              },
            },
          },
        },
      });

    if (previousTrainingDay) {
      return json(
        {
          state,
          weightUnitPreference: currentMesocycle.mesocycle.weightUnitPreference,
          mesocycleName: currentMesocycle.mesocycle.name,
          microcycleLength,
          calendarDays,
          readOnly: false,
          isFutureSession,
          trainingDaySessionUpdated,
          trainingDaySessionFinished,
          date,
          day: {
            dayNumber: day.dayNumber,
            microcycleNumber: day.microcycleNumber,
            trainingDay: {
              ...trainingDayData,
              exercises: trainingDayData.exercises.map((exercise) => {
                const previous = previousTrainingDay.exercises.find(
                  (previousExercise) =>
                    previousExercise.exerciseId === exercise.exercise!.id &&
                    previousExercise.number === exercise.number
                );

                return {
                  ...exercise,
                  previousSets: previous?.sets ?? [],
                  sets: exercise.sets.map((set) => {
                    const previousSet = previous?.sets.find(
                      ({ number }) => number === set.number
                    );

                    if (!previousSet) {
                      return {
                        ...set,
                        shouldIncreaseWeight: false,
                      };
                    }

                    return {
                      ...set,
                      shouldIncreaseWeight:
                        (previousSet.repsCompleted || 0) >=
                        set.repRangeUpperBound,
                    };
                  }),
                };
              }),
            },
          },
        },
        {
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        }
      );
    }

    if (currentMesocycle.previousRun) {
      const previousMesocycleRunTrainingDay =
        await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
          where: {
            microcycle: {
              mesocycleRunId: currentMesocycle.previousRun.id,
            },
            number: trainingDayData.number,
            completed: true,
            date: {
              lte: trainingDayData.date,
            },
          },
          orderBy: {
            date: "desc",
          },
          select: {
            microcycle: { select: { mesocycleRunId: true } },
            exercises: {
              select: {
                exerciseId: true,
                number: true,
                sets: {
                  orderBy: {
                    number: "asc",
                  },
                  select: {
                    id: true,
                    number: true,
                    completed: true,
                    repRangeLowerBound: true,
                    repRangeUpperBound: true,
                    repsCompleted: true,
                    rir: true,
                    weight: true,
                  },
                },
              },
            },
          },
        });

      if (previousMesocycleRunTrainingDay) {
        return json(
          {
            state,
            weightUnitPreference:
              currentMesocycle.mesocycle.weightUnitPreference,
            mesocycleName: currentMesocycle.mesocycle.name,
            microcycleLength,
            calendarDays,
            readOnly: false,
            isFutureSession,
            trainingDaySessionUpdated,
            trainingDaySessionFinished,
            date,
            day: {
              dayNumber: day.dayNumber,
              microcycleNumber: day.microcycleNumber,
              trainingDay: {
                ...trainingDayData,
                exercises: trainingDayData.exercises.map((exercise) => {
                  const previous =
                    previousMesocycleRunTrainingDay.exercises.find(
                      (previousExercise) =>
                        previousExercise.exerciseId === exercise.exercise!.id &&
                        previousExercise.number === exercise.number
                    );

                  return {
                    ...exercise,
                    previousSets: previous?.sets ?? [],
                    sets: exercise.sets.map((set) => {
                      const previousSet = previous?.sets.find(
                        ({ number }) => number === set.number
                      );

                      if (!previousSet) {
                        return {
                          ...set,
                          shouldIncreaseWeight: false,
                        };
                      }

                      return {
                        ...set,
                        shouldIncreaseWeight:
                          (previousSet.repsCompleted || 0) >=
                          set.repRangeUpperBound,
                      };
                    }),
                  };
                }),
              },
            },
          },
          {
            headers: {
              "Set-Cookie": await commitSession(session),
            },
          }
        );
      }
    }

    return json(
      {
        state,
        weightUnitPreference: currentMesocycle.mesocycle.weightUnitPreference,
        mesocycleName: currentMesocycle.mesocycle.name,
        microcycleLength,
        calendarDays,
        readOnly: false,
        isFutureSession,
        trainingDaySessionUpdated,
        trainingDaySessionFinished,
        date,
        day: {
          dayNumber: day.dayNumber,
          microcycleNumber: day.microcycleNumber,
          trainingDay: {
            ...trainingDayData,
            exercises: trainingDayData.exercises.map((exercise) => ({
              ...exercise,
              sets: exercise.sets.map((set) => ({
                ...set,
                shouldIncreaseWeight: false,
              })),
              previousSets: [],
            })),
          },
        },
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  }

  return json(
    {
      state,
      weightUnitPreference: currentMesocycle.mesocycle.weightUnitPreference,
      mesocycleName: currentMesocycle.mesocycle.name,
      microcycleLength,
      calendarDays,
      readOnly: true,
      isFutureSession,
      trainingDaySessionUpdated,
      trainingDaySessionFinished,
      date,
      day: null,
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  const { actionIntent } = intentSubmission.value;

  switch (actionIntent) {
    case "update-set": {
      const submission = parse(formData, { schema: updateSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const {
        id: setId,
        repsCompleted,
        rir,
        weight,
        wantsToComplete,
        wantsToRemove,
      } = submission.value;

      if (wantsToRemove) {
        const deleted =
          await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.delete({
            where: {
              id: setId,
            },
            select: {
              exerciseId: true,
              number: true,
            },
          });

        // Update the `number` value for the sets after the one we removed.
        await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.updateMany({
          where: {
            AND: [
              { exerciseId: deleted.exerciseId },
              { number: { gt: deleted.number } },
            ],
          },
          data: {
            number: { decrement: 1 },
          },
        });

        return redirectBack(request, { fallback: configRoutes.app.current });
      }

      await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.update({
        where: {
          id: setId,
        },
        data: {
          completed: { set: wantsToComplete },
          repsCompleted: { set: repsCompleted },
          rir: { set: rir },
          weight: { set: weight },
        },
      });

      return redirectBack(request, { fallback: configRoutes.app.current });
    }

    case "update-exercise": {
      const submission = parse(formData, { schema: updateExerciseSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, notes } = submission.value;

      await prisma.mesocycleRunMicrocycleTrainingDayExercise.update({
        where: {
          id,
        },
        data: {
          notes: { set: notes },
        },
      });

      return redirectBack(request, { fallback: configRoutes.app.current });
    }

    case "add-set": {
      const submission = parse(formData, { schema: addSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, setId } = submission.value;

      const lastSet =
        await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.findFirst({
          where: {
            exerciseId: id,
          },
          orderBy: {
            number: "desc",
          },
        });

      await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.create({
        data: {
          id: setId,
          exercise: { connect: { id } },
          number: lastSet ? lastSet.number + 1 : 1,
          repRangeLowerBound: lastSet?.repRangeLowerBound || 5,
          repRangeUpperBound: lastSet?.repRangeUpperBound || 8,
          weight: lastSet?.weight,
          rir: lastSet?.rir || 0,
          completed: false,
          repsCompleted: 0,
        },
      });

      return redirectBack(request, { fallback: configRoutes.app.current });
    }

    case "finish-or-update-session": {
      const submission = parse(formData, {
        schema: finishOrUpdateSessionSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, feedback } = submission.value;

      const thisTrainingDay =
        await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
          where: {
            AND: [
              { id },
              {
                exercises: { every: { sets: { every: { completed: true } } } },
              },
            ],
          },
          select: {
            id: true,
            completed: true,
            number: true,
            date: true,
            microcycle: {
              select: {
                mesocycleRun: {
                  select: {
                    id: true,
                    endDate: true,
                    mesocycleId: true,
                    progressiveRir: true,
                    mesocycle: {
                      select: {
                        weightUnitPreference: true,
                      },
                    },
                  },
                },
              },
            },
            exercises: {
              select: {
                exerciseId: true,
                number: true,
                sets: {
                  select: {
                    number: true,
                    repRangeLowerBound: true,
                    repRangeUpperBound: true,
                    repsCompleted: true,
                    rir: true,
                    weight: true,
                  },
                },
              },
            },
          },
        });

      if (!thisTrainingDay || !thisTrainingDay.microcycle?.mesocycleRun) {
        throw new Error(`This training day can't be finished`);
      }

      const lastTrainingDay =
        await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
          where: {
            microcycle: {
              mesocycleRun: {
                id: thisTrainingDay.microcycle.mesocycleRun.id,
              },
            },
          },
          select: {
            date: true,
          },
          orderBy: {
            date: "desc",
          },
        });

      if (!lastTrainingDay) {
        throw new Error(`lastTrainingDay is null, this shouldn't happen.`);
      }

      const isLastDayOfMesocycle = isSameDay(
        thisTrainingDay.date,
        lastTrainingDay.date
      );

      const session = await getSessionFromCookie(request);
      if (thisTrainingDay.completed) {
        session.flash("trainingDaySessionUpdated", generateId());
      } else {
        session.flash("trainingDaySessionFinished", generateId());
      }

      if (isLastDayOfMesocycle) {
        await prisma.$transaction([
          prisma.mesocycleRunMicrocycleTrainingDay.update({
            where: {
              id: thisTrainingDay.id,
            },
            data: {
              completed: true,
              feedback,
            },
            select: {
              id: true,
            },
          }),
          prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              currentMesocycleRun: {
                disconnect: true,
              },
            },
            select: {
              id: true,
            },
          }),
        ]);

        return redirect(
          configRoutes.app.mesocycles.viewHistory(
            thisTrainingDay.microcycle.mesocycleRun.mesocycleId
          ),
          {
            headers: {
              "Set-Cookie": await commitSession(session),
            },
          }
        );
      }

      // Find next training day and modify sets etc based on changes to this one.
      const nextTrainingDay =
        await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
          where: {
            microcycle: {
              mesocycleRunId: thisTrainingDay.microcycle.mesocycleRun.id,
            },
            number: thisTrainingDay.number,
            completed: false,
            date: {
              gt: thisTrainingDay.date,
            },
          },
          orderBy: {
            date: "asc",
          },
          select: {
            exercises: {
              select: {
                id: true,
                exerciseId: true,
                number: true,
                sets: {
                  orderBy: {
                    number: "asc",
                  },
                  select: {
                    id: true,
                    number: true,
                    completed: true,
                    repRangeLowerBound: true,
                    repRangeUpperBound: true,
                    repsCompleted: true,
                    rir: true,
                    weight: true,
                  },
                },
              },
            },
          },
        });

      if (nextTrainingDay) {
        const exercisesToUpdate = thisTrainingDay.exercises.reduce<
          {
            exerciseId: string;
            setsToCreate: {
              number: number;
              repRangeLowerBound: number;
              repRangeUpperBound: number;
              rir: number;
            }[];
            setsToRemove: number[];
            setsToUpdate: {
              number: number;
              rir: number;
            }[];
          }[]
        >((acc, thisExercise) => {
          const nextTrainingDayExercise = nextTrainingDay.exercises.find(
            (nextExercise) =>
              nextExercise.exerciseId === thisExercise.exerciseId &&
              nextExercise.number === thisExercise.number
          );

          const setsToUpdate = thisExercise.sets.reduce<
            {
              number: number;
              rir: number;
            }[]
          >((acc, set) => {
            if (
              set.rir > 0 &&
              thisTrainingDay.microcycle?.mesocycleRun?.progressiveRir
            ) {
              return [...acc, { number: set.number, rir: set.rir - 1 }];
            }

            return acc;
          }, []);

          if (nextTrainingDayExercise) {
            const thisExerciseSetsCount = thisExercise.sets.length;
            const nextTrainingDayExerciseSetsCount =
              nextTrainingDayExercise.sets.length;

            if (thisExerciseSetsCount > nextTrainingDayExerciseSetsCount) {
              const lastSet = nextTrainingDayExercise.sets.at(-1);

              return [
                ...acc,
                {
                  exerciseId: nextTrainingDayExercise.id,
                  setsToUpdate,
                  setsToCreate: Array.from(
                    {
                      length:
                        thisExerciseSetsCount -
                        nextTrainingDayExerciseSetsCount,
                    },
                    (_, i) => {
                      const number = (lastSet?.number || 0) + i + 1;
                      const set = thisExercise.sets[number - 1];

                      return {
                        number,
                        repRangeLowerBound: set.repRangeLowerBound,
                        repRangeUpperBound: set.repRangeUpperBound,
                        rir: set.rir,
                      };
                    }
                  ),
                  setsToRemove: [],
                },
              ];
            } else if (
              thisExerciseSetsCount < nextTrainingDayExerciseSetsCount
            ) {
              const lastSet = nextTrainingDayExercise.sets.at(-1)!;

              return [
                ...acc,
                {
                  exerciseId: nextTrainingDayExercise.id,
                  setsToUpdate,
                  setsToCreate: [],
                  setsToRemove: Array.from(
                    {
                      length:
                        nextTrainingDayExerciseSetsCount -
                        thisExerciseSetsCount,
                    },
                    (_, i) => lastSet.number - i
                  ),
                },
              ];
            } else if (setsToUpdate.length > 0) {
              return [
                ...acc,
                {
                  exerciseId: nextTrainingDayExercise.id,
                  setsToUpdate,
                  setsToCreate: [],
                  setsToRemove: [],
                },
              ];
            }
          }

          return acc;
        }, []);

        await prisma.$transaction([
          prisma.mesocycleRunMicrocycleTrainingDay.update({
            where: {
              id: thisTrainingDay.id,
            },
            data: {
              completed: true,
              feedback,
            },
            select: {
              id: true,
            },
          }),

          ...exercisesToUpdate.map((update) => {
            if (update.setsToCreate.length > 0) {
              return prisma.mesocycleRunMicrocycleTrainingDayExercise.update({
                where: {
                  id: update.exerciseId,
                },
                data: {
                  sets: {
                    createMany: {
                      data: update.setsToCreate.map((set) => ({
                        number: set.number,
                        repRangeLowerBound: set.repRangeLowerBound,
                        repRangeUpperBound: set.repRangeUpperBound,
                        rir: set.rir,
                      })),
                    },
                  },
                },
              });
            }

            return prisma.mesocycleRunMicrocycleTrainingDayExercise.update({
              where: {
                id: update.exerciseId,
              },
              data: {
                sets: {
                  deleteMany: update.setsToRemove.map((setNumber) => ({
                    AND: [{ number: setNumber }, { completed: false }],
                  })),
                },
              },
            });
          }),
        ]);
      }

      return redirectBack(request, {
        fallback: configRoutes.app.current,
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    default: {
      throw new Error("The action intent is not valid");
    }
  }
};

export default function Current() {
  const data = useLoaderData<typeof loader>();

  if (data.state === CurrentMesocycleState.NOT_FOUND) {
    return <CurrentMesocycleNotFound data={data} />;
  }

  if (data.state === CurrentMesocycleState.STARTS_IN_THE_FUTURE) {
    return <CurrentMesocycleStartsInTheFuture data={data} />;
  }

  return <DayPlan data={data} />;
}
