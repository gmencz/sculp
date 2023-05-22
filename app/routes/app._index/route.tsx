import type { JointPain } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  addDays,
  differenceInDays,
  format,
  isAfter,
  isToday,
  startOfToday,
  subDays,
} from "date-fns";
import {
  getCurrentMesocycleDetailed,
  getMesocyclesCount,
  getTrainingDay,
} from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";
import { CurrentMesocycleNotFound } from "./current-mesocycle-not-found";
import { CurrentMesocycleStartsInTheFuture } from "./current-mesocycle-starts-in-the-future";
import { TodayPlan } from "./today-plan";
import { exerciseSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { prisma } from "~/db.server";
import { getRepRangeBounds } from "~/utils";
import { updateSetSchema } from "./schema";

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
  today: {
    trainingDay: {
      label: string;

      exercises: {
        number: number;
        id: string;
        notes: string | null;
        sets: {
          number: number;
          id: string;
          weight: number;
          rir: number;
          repRangeLowerBound: number;
          repRangeUpperBound: number;
          completed: boolean;
          repsCompleted: number | null;
          targetRepsToComplete: number;
        }[];
        exercise: {
          name: string;
          notes: string | null;
          jointPain: JointPain | null;
          muscleGroups: {
            name: string;
          }[];
        };
      }[];
    } | null;
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

  // The user starts the mesocycle some time in the future.
  const today = startOfToday();

  // currentMesocycle.startDate = subDays(new Date(), 2);
  currentMesocycle.startDate = today;

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

  // The user starts the mesocycle today so this is day 1 of micro 1
  if (isToday(currentMesocycle.startDate)) {
    const trainingDay = currentMesocycle.microcycles[0].trainingDays.find(
      (trainingDay) => trainingDay.number === 1
    );

    if (!trainingDay) {
      data = {
        type: "current_mesocycle_started",
        mesocycleName: currentMesocycle.mesocycle.name,
        today: {
          trainingDay: null,
          dayNumber: 1,
          microcycleNumber: 1,
        },
      };

      return json(data);
    }

    const trainingDayData = await getTrainingDay(trainingDay.id);

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    data = {
      type: "current_mesocycle_started",
      mesocycleName: currentMesocycle.mesocycle.name,
      today: {
        trainingDay: trainingDayData,
        dayNumber: 1,
        microcycleNumber: 1,
      },
    };

    return json(data);
  }

  // If we got here, it means the user's current mesocycle has started at least 1 day ago.

  const microcycleLength =
    currentMesocycle.mesocycle._count.trainingDays +
    currentMesocycle.mesocycle.restDays.length;

  // Here we make an array with the length of a microcycle, this is so we can loop through it
  // later on inside each microcycle.
  const microcycleDays = Array(microcycleLength).fill(0);

  let foundDay = null;
  for (
    let microcycleIndex = 0;
    microcycleIndex < currentMesocycle.microcycles.length;
    microcycleIndex++
  ) {
    if (foundDay) break;

    const microcycle = currentMesocycle.microcycles[microcycleIndex];
    for (let dayNumber = 1; dayNumber < microcycleDays.length; dayNumber++) {
      const isDayToday = isToday(
        addDays(currentMesocycle.startDate, microcycleIndex + dayNumber)
      );

      if (isDayToday) {
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
      today: {
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
    today: {
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
  const submission = parse(formData, { schema: exerciseSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { id: exerciseId, sets } = submission.value;

  const wantsToCompleteSet = sets.find((set) => set.wantsToComplete);
  if (wantsToCompleteSet) {
    const {
      id: setId,
      repRange,
      repsCompleted,
      rir,
      weight,
    } = updateSetSchema.parse(wantsToCompleteSet);

    const [repRangeLowerBound, repRangeUpperBound] =
      getRepRangeBounds(repRange);

    // Update existing set
    if (setId) {
      await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.update({
        where: {
          id: setId,
        },
        data: {
          repRangeLowerBound: { set: repRangeLowerBound },
          repRangeUpperBound: { set: repRangeUpperBound },
          completed: { set: true },
          repsCompleted: { set: repsCompleted },
          rir: { set: rir },
          weight: { set: weight },
        },
      });

      return json(submission);
    }

    // Create new set
  }

  throw new Error("not impl");
};

export default function Today() {
  const data = useLoaderData<typeof loader>();

  if (data.type === "current_mesocycle_not_found") {
    return <CurrentMesocycleNotFound data={data} />;
  }

  if (data.type === "current_mesocycle_starts_in_the_future") {
    return <CurrentMesocycleStartsInTheFuture data={data} />;
  }

  return <TodayPlan data={data} />;
}
