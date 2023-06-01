import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { requireUser } from "~/session.server";
import { TrainingDay } from "../app._index/day-plan/training-day";
import { RestDay } from "../app._index/day-plan/rest-day";
import { prisma } from "~/db.server";
import { getTrainingDayById } from "~/models/mesocycle.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { runId } = params;
  if (!runId) {
    throw new Error("runId param is falsy, this should never happen");
  }

  const mesocycleRun = await prisma.mesocycleRun.findFirst({
    where: {
      id: runId,
      ranByUserId: user.id,
    },
    select: {
      startDate: true,
      endDate: true,
      microcycles: {
        select: {
          trainingDays: {
            select: {
              id: true,
              number: true,
              date: true,
            },
          },
        },
      },
      mesocycle: {
        select: {
          name: true,
          restDays: true,
          microcycles: true,
          _count: { select: { trainingDays: true } },
        },
      },
    },
  });

  if (!mesocycleRun) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  let date: Date;
  if (dateParam) {
    date = new Date(decodeURIComponent(dateParam));
  } else {
    date = mesocycleRun.startDate;
  }

  const microcycleLength =
    mesocycleRun.mesocycle._count.trainingDays +
    mesocycleRun.mesocycle.restDays.length;

  // Here we make an array with the length of a microcycle, this is so we can loop through it
  // later on inside each microcycle.
  const microcycleDays = Array(microcycleLength).fill(0);

  const mesocycleDaysInterval = eachDayOfInterval({
    start: mesocycleRun.startDate,
    end: addDays(
      mesocycleRun.startDate,
      mesocycleRun.mesocycle.microcycles * microcycleLength - 1
    ),
  });

  const calendarDays = mesocycleDaysInterval.map((intervalDate) => {
    const isPlannedTrainingDay = mesocycleRun.microcycles.some((microcycle) =>
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
    microcycleIndex < mesocycleRun.microcycles.length;
    microcycleIndex++
  ) {
    if (foundDay) break;

    const microcycle = mesocycleRun.microcycles[microcycleIndex];
    for (let dayNumber = 1; dayNumber < microcycleDays.length; dayNumber++) {
      const isDate = isSameDay(
        date,
        addDays(
          mesocycleRun.startDate,
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

  if (foundDay.trainingDay?.id) {
    const trainingDayData = await getTrainingDayById(foundDay.trainingDay.id);

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    return json({
      mesocycleName: mesocycleRun.mesocycle.name,
      microcycleLength,
      calendarDays,
      readOnly: true,
      day: {
        dayNumber: foundDay.dayNumber,
        microcycleNumber: foundDay.microcycleNumber,
        trainingDay: trainingDayData,
      },
    });
  }

  return json({
    mesocycleName: mesocycleRun.mesocycle.name,
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

export default function MesocycleHistory() {
  const { day, mesocycleName } = useLoaderData<typeof loader>();

  if (day.trainingDay) {
    return (
      <TrainingDay
        mesocycleName={mesocycleName}
        dayNumber={day.dayNumber}
        microcycleNumber={day.microcycleNumber}
        trainingDay={day.trainingDay}
      />
    );
  }

  return (
    <RestDay
      dayNumber={day.dayNumber}
      mesocycleName={mesocycleName}
      microcycleNumber={day.microcycleNumber}
    />
  );
}
