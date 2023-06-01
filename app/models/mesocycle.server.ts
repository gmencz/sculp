import { prisma } from "~/db.server";

export async function getTrainingDayById(id: string) {
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
