import { redirect } from "@remix-run/server-runtime";
import { nanoid } from "nanoid";
import { configRoutes } from "~/config-routes";
import { prisma } from "~/db.server";
import { getSession, sessionStorage } from "~/session.server";
import { generateId, getRepRangeBounds } from "~/utils";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInWeeks: number;
  trainingDaysPerWeek: number;
};

const getDraftMesocycleSessionKey = (id: string) => `draft-mesocycle-${id}`;

export async function findMesocycleByNameUserId(name: string, userId: string) {
  return prisma.mesocycle.findUnique({
    where: {
      name_userId: {
        name,
        userId,
      },
    },
    select: {
      id: true,
    },
  });
}

export async function createDraftMesocycle(
  request: Request,
  input: DraftMesocycle
) {
  const session = await getSession(request);
  const id = nanoid();
  session.set(getDraftMesocycleSessionKey(id), input);
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

type CreateMesocycleInput = {
  trainingDays: {
    label: string;
    exercises: {
      id: string;
      sets: {
        weight: number;
        rir: number;
        repRange: string;
      }[];
      dayNumber: number;
      notes?: string | undefined;
    }[];
    dayNumber: number;
  }[];

  draftId: string;
  name: string;
  goal: string;
  durationInWeeks: number;
};

export async function createMesocycle(
  request: Request,
  userId: string,
  { trainingDays, name, goal, durationInWeeks, draftId }: CreateMesocycleInput
) {
  await prisma.mesocycle.create({
    data: {
      name,
      durationInWeeks,
      goal,
      userId,
      trainingDays: {
        create: trainingDays.map((trainingDay) => ({
          label: trainingDay.label,
          number: trainingDay.dayNumber,
          exercises: {
            create: trainingDay.exercises.map((exercise, index) => ({
              notes: exercise.notes,
              exercise: {
                connect: {
                  id: exercise.id,
                },
              },
              number: index + 1,
              sets: {
                create: exercise.sets.map((set, index) => {
                  const [repRangeLowerBound, repRangeUpperBound] =
                    getRepRangeBounds(set.repRange);

                  return {
                    number: index + 1,
                    weight: set.weight,
                    repRangeLowerBound,
                    repRangeUpperBound,
                    rir: set.rir,
                  };
                }),
              },
            })),
          },
        })),
      },
    },
    select: {
      id: true,
    },
  });

  const session = await getSession(request);
  session.unset(getDraftMesocycleSessionKey(draftId));
  return redirect(configRoutes.mesocycles, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

type UpdateMesocycleInput = {
  trainingDays: {
    id: string;
    label: string;
    exercises: {
      id: string | null;
      sets: {
        id: string | null;
        rir: number;
        weight: number;
        repRange: string;
      }[];
      searchedExerciseId: string;
      notes?: string | undefined;
    }[];
  }[];
};

export async function updateMesocycle(
  id: string,
  userId: string,
  input: UpdateMesocycleInput
) {
  const mesocycle = await prisma.mesocycle.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  // Check if the mesocycle exists and belongs to the current user.
  if (!mesocycle || mesocycle.userId !== userId) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const updatedMesocycle = await prisma.mesocycle.update({
    where: {
      id,
    },
    select: {
      id: true,
    },
    data: {
      trainingDays: {
        update: input.trainingDays.map((trainingDay) => ({
          where: { id: trainingDay.id },
          data: {
            label: { set: trainingDay.label },
            exercises: {
              deleteMany: { mesocycleTrainingDayId: trainingDay.id },

              create: trainingDay.exercises.map((exercise, index) => ({
                notes: exercise.notes,
                exercise: {
                  connect: {
                    id: exercise.searchedExerciseId,
                  },
                },
                number: index + 1,
                sets: {
                  create: exercise.sets.map((set, index) => {
                    const [repRangeLowerBound, repRangeUpperBound] =
                      getRepRangeBounds(set.repRange);

                    return {
                      number: index + 1,
                      weight: set.weight,
                      repRangeLowerBound,
                      repRangeUpperBound,
                      rir: set.rir,
                    };
                  }),
                },
              })),
            },
          },
        })),
      },
    },
  });

  return redirect(
    configRoutes.mesocycleView(updatedMesocycle.id) +
      `?success_id=${generateId()}`
  );
}

export async function getMesocycles(userId: string) {
  return prisma.mesocycle.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      goal: true,
      durationInWeeks: true,
      _count: { select: { trainingDays: true } },
    },
  });
}

export async function getMesocycle(id: string, userId: string) {
  return prisma.mesocycle.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      goal: true,
      durationInWeeks: true,
      trainingDays: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          label: true,
          exercises: {
            orderBy: { number: "asc" },
            select: {
              id: true,
              exercise: {
                select: {
                  id: true,
                  name: true,
                },
              },
              number: true,
              notes: true,
              sets: {
                orderBy: { number: "asc" },
                select: {
                  id: true,
                  number: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                  weight: true,
                  rir: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
