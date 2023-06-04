import { redirect } from "@remix-run/node";
import { nanoid } from "nanoid";
import { getSessionFromCookie, sessionStorage } from "./session.server";
import { configRoutes } from "./routes";
import { addDays, eachDayOfInterval, isSameDay } from "date-fns";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInMicrocycles: number;
  restDaysPerMicrocycle: number[];
  trainingDaysPerMicrocycle: number[];
  presetName?: string;
};

export async function getDraftMesocycle(
  request: Request,
  id: string
): Promise<DraftMesocycle | null> {
  const session = await getSessionFromCookie(request);
  const draftMesocycle = await session.get(`draft-mesocycle-${id}`);
  return draftMesocycle;
}

export async function createDraftMesocycle(
  request: Request,
  draftMesocycle: DraftMesocycle
) {
  const session = await getSessionFromCookie(request);
  const id = nanoid();
  session.set(`draft-mesocycle-${id}`, draftMesocycle);
  return redirect(configRoutes.app.mesocycles.new.step2(id), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function deleteDraftMesocycle(request: Request, id: string) {
  const session = await getSessionFromCookie(request);
  session.unset(`draft-mesocycle-${id}`);
  return redirect(configRoutes.app.mesocycles.list, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export function getMesocycleRunDayByDate(
  mesocycleRun: {
    startDate: Date;
    endDate: Date;
    microcycleLength: number;
    microcycles: {
      trainingDays: {
        number: number;
        date: Date;
        id: string;
      }[];
    }[];
  },
  date: Date
) {
  // Here we make an array with the length of a microcycle, this is so we can loop through it
  // later on inside each microcycle.
  const microcycleDays = Array(mesocycleRun.microcycleLength).fill(0);

  // Try and find the training day or rest day for the date param.
  let day = null;
  for (
    let microcycleIndex = 0;
    microcycleIndex < mesocycleRun.microcycles.length;
    microcycleIndex++
  ) {
    if (day) break;

    const microcycle = mesocycleRun.microcycles[microcycleIndex];
    for (let dayNumber = 1; dayNumber < microcycleDays.length; dayNumber++) {
      const isDate = isSameDay(
        date,
        addDays(
          mesocycleRun.startDate,
          microcycleIndex * mesocycleRun.microcycleLength + dayNumber - 1
        )
      );

      if (isDate) {
        const trainingDay =
          microcycle.trainingDays.find(({ number }) => number === dayNumber) ||
          null;

        day = {
          trainingDay,
          dayNumber,
          microcycleNumber: microcycleIndex + 1,
        };
      }
    }
  }

  return day;
}

export function getMesocycleRunCalendarDays(
  mesocycleRun: {
    startDate: Date;
    endDate: Date;
    microcycleLength: number;
    microcycles: {
      trainingDays: {
        number: number;
        date: Date;
        id: string;
      }[];
    }[];
  },
  date: Date
) {
  const mesocycleDaysInterval = eachDayOfInterval({
    start: mesocycleRun.startDate,
    end: addDays(
      mesocycleRun.startDate,
      mesocycleRun.microcycles.length * mesocycleRun.microcycleLength - 1
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

  return calendarDays;
}
