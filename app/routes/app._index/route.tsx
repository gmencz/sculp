import { useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  format,
  isAfter,
  isSameDay,
  isToday,
  startOfToday,
} from "date-fns";
import {
  getCurrentMesocycleDetailed,
  getMesocyclesCount,
  getTrainingDay,
} from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";
import { CurrentMesocycleNotFound } from "./current-mesocycle-not-found";
import { CurrentMesocycleStartsInTheFuture } from "./current-mesocycle-starts-in-the-future";
import { parse } from "@conform-to/zod";
import {
  addSetSchema,
  schema,
  updateExerciseSchema,
  updateSetSchema,
} from "./schema";
import { getRepRangeBounds, redirectBack } from "~/utils";
import { prisma } from "~/db.server";
import { configRoutes } from "~/config-routes";
import { DayPlan } from "./day-plan";

export type CurrentMesocycleNotFoundData = {
  type: "current_mesocycle_not_found";
  mesocyclesCount: number;
};

export type CurrentMesocycleStartsInTheFutureData = {
  type: "current_mesocycle_starts_in_the_future";
  formattedStartDate: string;
  mesocycleName: string;
};

export type CurrentMesocycleStartedData = {
  type: "current_mesocycle_started";
  mesocycleName: string;
  microcycleLength: number;
  readOnly: boolean;
  calendarDays: {
    date: string;
    isPlannedTrainingDay: boolean;
    isCurrent: boolean;
  }[];
  day: {
    trainingDay: Awaited<ReturnType<typeof getTrainingDay>>;
    dayNumber: number;
    microcycleNumber: number;
  };
};

type Data =
  | CurrentMesocycleNotFoundData
  | CurrentMesocycleStartsInTheFutureData
  | CurrentMesocycleStartedData;

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  let data: Data | null = null;

  const currentMesocycle = await getCurrentMesocycleDetailed(user.id);
  if (!currentMesocycle) {
    data = {
      type: "current_mesocycle_not_found",
      mesocyclesCount: await getMesocyclesCount(user.id),
    };

    return json(data);
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

    data = {
      type: "current_mesocycle_starts_in_the_future",
      formattedStartDate,
      mesocycleName: currentMesocycle.mesocycle.name,
    };

    return json(data);
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  let date: Date;
  if (dateParam) {
    date = new Date(decodeURIComponent(dateParam));
  } else {
    date = today;
  }

  // Can only edit the training if it's today's training.
  const readOnly = !isToday(date);

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

  const calendarDays: CurrentMesocycleStartedData["calendarDays"] =
    mesocycleDaysInterval.map((intervalDate) => {
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
        addDays(currentMesocycle.startDate, microcycleIndex + dayNumber - 1)
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

  if (foundDay.trainingDay?.id) {
    const trainingDayData = await getTrainingDay(foundDay.trainingDay.id);

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    data = {
      type: "current_mesocycle_started",
      mesocycleName: currentMesocycle.mesocycle.name,
      microcycleLength,
      calendarDays,
      readOnly,
      day: {
        dayNumber: foundDay.dayNumber,
        microcycleNumber: foundDay.microcycleNumber,
        trainingDay: trainingDayData,
      },
    };

    return json(data);
  }

  data = {
    type: "current_mesocycle_started",
    mesocycleName: currentMesocycle.mesocycle.name,
    microcycleLength,
    calendarDays,
    readOnly,
    day: {
      dayNumber: foundDay.dayNumber,
      microcycleNumber: foundDay.microcycleNumber,
      trainingDay: null,
    },
  };

  return json(data);
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

        return redirectBack(request, { fallback: configRoutes.appRoot });
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

      return redirectBack(request, { fallback: configRoutes.appRoot });
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

      return redirectBack(request, { fallback: configRoutes.appRoot });
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
          weight: lastSet?.weight || 0,
          rir: lastSet?.rir || 0,
          completed: false,
          repsCompleted: 0,
        },
      });

      return redirectBack(request, { fallback: configRoutes.appRoot });
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

  if (data.type === "current_mesocycle_not_found") {
    return <CurrentMesocycleNotFound data={data} />;
  }

  if (data.type === "current_mesocycle_starts_in_the_future") {
    return <CurrentMesocycleStartsInTheFuture data={data} />;
  }

  return <DayPlan data={data} />;
}
