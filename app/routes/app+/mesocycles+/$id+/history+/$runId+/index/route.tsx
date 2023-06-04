import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { RestDay } from "~/routes/app+/index/day-plan/rest-day";
import { TrainingDay } from "~/routes/app+/index/day-plan/training-day";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import {
  getMesocycleRunCalendarDays,
  getMesocycleRunDayByDate,
} from "~/utils/mesocycles.server";

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

  const calendarDays = getMesocycleRunCalendarDays(
    {
      startDate: mesocycleRun.startDate,
      endDate: mesocycleRun.endDate,
      microcycles: mesocycleRun.microcycles,
      microcycleLength,
    },
    date
  );

  const day = getMesocycleRunDayByDate(
    {
      startDate: mesocycleRun.startDate,
      endDate: mesocycleRun.endDate,
      microcycles: mesocycleRun.microcycles,
      microcycleLength,
    },
    date
  );

  if (!day) {
    throw new Error("day is null, this should never happen");
  }

  if (day.trainingDay?.id) {
    const trainingDayData =
      await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
        where: { id: day.trainingDay.id },
        select: {
          id: true,
          completed: true,
          label: true,
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

    return json({
      mesocycleName: mesocycleRun.mesocycle.name,
      microcycleLength,
      calendarDays,
      readOnly: true,
      day: {
        dayNumber: day.dayNumber,
        microcycleNumber: day.microcycleNumber,
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
      dayNumber: day.dayNumber,
      microcycleNumber: day.microcycleNumber,
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
