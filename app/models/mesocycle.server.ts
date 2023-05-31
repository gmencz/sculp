import type { Submission } from "@conform-to/react";
import { json, redirect } from "@remix-run/server-runtime";
import { addDays, startOfDay } from "date-fns";
import { nanoid } from "nanoid";
import { configRoutes } from "~/config-routes";
import { prisma } from "~/db.server";
import { getSession, sessionStorage } from "~/session.server";
import { generateId, getRepRangeBounds } from "~/utils";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInMicrocycles: number;
  restDaysPerMicrocycle: number[];
  trainingDaysPerMicrocycle: number[];
  presetName?: string;
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
  return redirect(configRoutes.mesocycles.newStepTwo(id), {
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
        weight: number | null;
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
  microcycles: number;
  restDays: number[];
};

export async function createMesocycle(
  request: Request,
  userId: string,
  {
    trainingDays,
    name,
    goal,
    microcycles,
    restDays,
    draftId,
  }: CreateMesocycleInput
) {
  await prisma.mesocycle.create({
    data: {
      name,
      microcycles,
      restDays,
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
  return redirect(configRoutes.mesocycles.list, {
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
        weight: number | null;
        repRange: string;
      }[];
      searchedExerciseId: string;
      notes?: string | undefined;
    }[];
  }[];
};

export async function updateMesocycle(
  url: URL,
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

  url.searchParams.set("success_id", generateId());

  return redirect(
    configRoutes.mesocycles.view(updatedMesocycle.id) + url.search
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
      microcycles: true,
      restDays: true,
      _count: { select: { trainingDays: true } },
    },
  });
}

export async function getMesocycle(
  id: string,
  userId: string,
  includeMuscleGroups: boolean = false
) {
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
      microcycles: true,
      restDays: true,
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
                  muscleGroups: includeMuscleGroups
                    ? {
                        select: {
                          name: true,
                        },
                      }
                    : false,
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

export async function getCurrentMesocycle(userId: string) {
  return prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: userId,
    },
    select: { id: true, mesocycle: { select: { id: true } } },
  });
}

export async function getCurrentMesocycleDetailed(userId: string) {
  return prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: userId,
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
}

export async function getMesocyclesCount(userId: string) {
  return prisma.mesocycle.count({
    where: {
      userId,
    },
  });
}

export async function getTrainingDay(id: string) {
  return prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
    where: { id },
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
}

type StartMesocycleInput = {
  startDate: Date;
};

export async function startMesocycle(
  userId: string,
  id: string,
  submission: Submission,
  input: StartMesocycleInput
) {
  const mesocycle = await prisma.mesocycle.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      microcycles: true,
      restDays: true,
      _count: { select: { trainingDays: true } },
      trainingDays: {
        select: {
          number: true,
          label: true,
          exercises: {
            select: {
              exercise: { select: { id: true } },
              notes: true,
              number: true,
              sets: {
                select: {
                  number: true,
                  weight: true,
                  rir: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const currentMesocycle = await getCurrentMesocycle(userId);
  if (currentMesocycle) {
    submission.error["form"] =
      "You can't start this mesocycle because you are currently in the middle of one. You can stop your current mesocycle on the mesocycles page and then start this one.";

    return json(submission, { status: 400 });
  }

  const totalMesocycleDays =
    mesocycle.microcycles *
    (mesocycle.restDays.length + mesocycle._count.trainingDays);

  const endDate = addDays(input.startDate, totalMesocycleDays);

  const startDate = startOfDay(input.startDate);

  const microcycleLength =
    mesocycle._count.trainingDays + mesocycle.restDays.length;

  await prisma.mesocycleRun.create({
    data: {
      mesocycle: { connect: { id } },
      currentUser: { connect: { id: userId } },
      ranByUser: { connect: { id: userId } },
      startDate,
      endDate,
      microcycles: {
        // Create the microcycles with the values from the mesocycle.
        create: Array.from({ length: mesocycle.microcycles }, (_, i) => i).map(
          (microcycleIndex) => ({
            restDays: mesocycle.restDays,
            trainingDays: {
              create: mesocycle.trainingDays.map((trainingDay) => ({
                number: trainingDay.number,
                label: trainingDay.label,
                completed: false,
                date: addDays(
                  startDate,
                  microcycleIndex * microcycleLength + trainingDay.number - 1
                ),
                exercises: {
                  create: trainingDay.exercises.map((exercise) => ({
                    number: exercise.number,
                    notes: exercise.notes,
                    exercise: { connect: { id: exercise.exercise.id } },
                    sets: {
                      create: exercise.sets.map((set) => ({
                        number: set.number,
                        repRangeLowerBound: set.repRangeLowerBound,
                        repRangeUpperBound: set.repRangeUpperBound,
                        rir: set.rir,
                        weight: set.weight,
                        completed: false,
                      })),
                    },
                  })),
                },
              })),
            },
          })
        ),
      },
    },
  });

  return redirect(configRoutes.appRoot);
}

export async function stopMesocycle(userId: string, id: string) {
  const mesocycle = await getMesocycle(id, userId, true);
  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const currentMesocycle = await getCurrentMesocycle(userId);

  // Can't stop a mesocycle that is not the current one.
  if (
    !currentMesocycle?.mesocycle ||
    currentMesocycle.mesocycle.id !== mesocycle.id
  ) {
    return redirect(configRoutes.mesocycles.list);
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      currentMesocycleRun: {
        disconnect: true,
      },
    },
    select: {
      id: true,
    },
  });

  return redirect(configRoutes.mesocycles.list);
}

export function getMesocyclesPresets() {
  return prisma.mesocyclePreset.findMany({
    select: {
      name: true,
      microcycles: true,
      restDays: true,
      trainingDays: {
        select: {
          number: true,
        },
      },
    },
  });
}

export function getMesocyclePresetByName(name: string) {
  return prisma.mesocyclePreset.findUnique({
    where: { name },
    select: {
      trainingDays: {
        orderBy: {
          number: "asc",
        },
        select: {
          number: true,
          label: true,
          exercises: {
            orderBy: {
              number: "asc",
            },
            select: {
              number: true,
              exerciseId: true,
              notes: true,
              sets: {
                orderBy: {
                  number: "asc",
                },
                select: {
                  rir: true,
                  weight: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
