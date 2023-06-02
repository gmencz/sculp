import { useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  startOfToday,
} from "date-fns";
import { CurrentMesocycleNotFound } from "./current-mesocycle-not-found";
import { CurrentMesocycleStartsInTheFuture } from "./current-mesocycle-starts-in-the-future";
import { parse } from "@conform-to/zod";
import {
  addSetSchema,
  schema,
  updateExerciseSchema,
  updateSetSchema,
} from "./schema";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import { DayPlan } from "./day-plan";
import { redirectBack } from "~/utils/responses.server";
import { getRepRangeBounds } from "~/utils/rep-ranges";
import { requireUser } from "~/services/auth/api/require-user";

export enum CurrentMesocycleState {
  NOT_FOUND,
  STARTS_IN_THE_FUTURE,
  STARTED,
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  let state: CurrentMesocycleState;
  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: {
      startDate: true,
      mesocycle: {
        select: {
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

  // Here we make an array with the length of a microcycle, this is so we can loop through it
  // later on inside each microcycle.
  const microcycleDays = Array(microcycleLength).fill(0);

  const mesocycleDaysInterval = eachDayOfInterval({
    start: currentMesocycle.startDate,
    end: addDays(
      currentMesocycle.startDate,
      currentMesocycle.mesocycle.microcycles * microcycleLength - 1
    ),
  });

  const calendarDays = mesocycleDaysInterval.map((intervalDate) => {
    const isPlannedTrainingDay = currentMesocycle.microcycles.some(
      (microcycle) =>
        microcycle.trainingDays.some((trainingDay) =>
          isSameDay(trainingDay.date, intervalDate)
        )
    );

    return {
      date: intervalDate.toISOString(),
      isCurrent: isSameDay(intervalDate, date),
      isPlannedTrainingDay,
    };
  });

  // Try and find the training day or rest day for the date param.
  let foundDay = null;
  for (
    let microcycleIndex = 0;
    microcycleIndex < currentMesocycle.microcycles.length;
    microcycleIndex++
  ) {
    if (foundDay) break;

    const microcycle = currentMesocycle.microcycles[microcycleIndex];
    for (let dayNumber = 1; dayNumber < microcycleDays.length; dayNumber++) {
      const isDate = isSameDay(
        date,
        addDays(
          currentMesocycle.startDate,
          microcycleIndex * microcycleLength + dayNumber - 1
        )
      );

      if (isDate) {
        const trainingDay =
          microcycle.trainingDays.find(({ number }) => number === dayNumber) ||
          null;

        foundDay = {
          trainingDay,
          dayNumber,
          microcycleNumber: microcycleIndex + 1,
        };
      }
    }
  }

  if (!foundDay) {
    throw new Error("foundDay is null, this should never happen");
  }

  state = CurrentMesocycleState.STARTED;
  if (foundDay.trainingDay?.id) {
    const trainingDayData =
      await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
        where: { id: foundDay.trainingDay.id },
        select: {
          completed: true,
          label: true,
          date: true,
          exercises: {
            orderBy: {
              number: "asc",
            },
            select: {
              id: true,
              notes: true,
              number: true,
              previousRun: {
                select: {
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
              exercise: {
                select: {
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

    // Can only edit the training if it's today's training or an uncompleted past training day.
    const canEdit =
      isToday(date) ||
      (!trainingDayData.completed && isBefore(trainingDayData.date, today));

    return json({
      state,
      mesocycleName: currentMesocycle.mesocycle.name,
      microcycleLength,
      calendarDays,
      readOnly: !canEdit,
      day: {
        dayNumber: foundDay.dayNumber,
        microcycleNumber: foundDay.microcycleNumber,
        trainingDay: trainingDayData,
      },
    });
  }

  return json({
    state,
    mesocycleName: currentMesocycle.mesocycle.name,
    microcycleLength,
    calendarDays,
    readOnly: true,
    day: {
      dayNumber: foundDay.dayNumber,
      microcycleNumber: foundDay.microcycleNumber,
      trainingDay: null,
    },
  });
};

export const action = async ({ request }: ActionArgs) => {
  await requireUser(request);
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
        repRange,
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

      const [repRangeLowerBound, repRangeUpperBound] =
        getRepRangeBounds(repRange);

      await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.update({
        where: {
          id: setId,
        },
        data: {
          repRangeLowerBound: { set: repRangeLowerBound },
          repRangeUpperBound: { set: repRangeUpperBound },
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
          number: lastSet?.number ? lastSet.number + 1 : 1,
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

    case "finish-session": {
      throw new Error("Not implemented");
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
