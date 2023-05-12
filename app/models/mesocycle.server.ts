import { redirect } from "@remix-run/server-runtime";
import { nanoid } from "nanoid";
import { configRoutes } from "~/config-routes";
import { getSession, sessionStorage } from "~/session.server";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInWeeks: number;
  trainingDays: DraftMesocycleTrainingDay[];
};

export type DraftMesocycleTrainingDay = {
  label: string;
  exercises: DraftMesocycleTrainingDayExercise[];
  dayNumber: number;
};

export type DraftMesocycleTrainingDayExercise = {
  sets: DraftMesocycleTrainingDayExerciseSet[];
  exerciseId: string; // The id of the selected exercise in the database.
  dayNumber: number;
  notes?: string;
};

export type DraftMesocycleTrainingDayExerciseSet = {
  rir: number;
  weight: number;
  repRange: string;
};

const getDraftMesocycleSessionKey = (id: string) => `draft-mesocycle-${id}`;

export async function createDraftMesocycle(
  request: Request,
  data: DraftMesocycle
) {
  const session = await getSession(request);
  const id = nanoid();
  session.set(getDraftMesocycleSessionKey(id), data);
  return redirect(configRoutes.newMesocycleDesign(id), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getDraftMesocycle(
  request: Request,
  id: string
): Promise<DraftMesocycle | null> {
  const session = await getSession(request);
  const mesocycle = await session.get(getDraftMesocycleSessionKey(id));
  return mesocycle;
}

export async function addExerciseToDraftMesocycle(
  request: Request,
  mesocycleId: string,
  newExercise: DraftMesocycleTrainingDayExercise
) {
  const mesocycle = await getDraftMesocycle(request, mesocycleId);
  if (!mesocycle) {
    throw new Error("addExerciseToDraftMesocycle: mesocycle is null");
  }

  const updatedMesocycle: DraftMesocycle = {
    ...mesocycle,
    trainingDays: mesocycle.trainingDays.map((trainingDay) => {
      if (trainingDay.dayNumber !== newExercise.dayNumber) {
        return trainingDay;
      }

      return {
        ...trainingDay,
        exercises: [...trainingDay.exercises, newExercise],
      };
    }),
  };

  const session = await getSession(request);
  session.set(getDraftMesocycleSessionKey(mesocycleId), updatedMesocycle);
  return redirect(configRoutes.newMesocycleDesign(mesocycleId), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
