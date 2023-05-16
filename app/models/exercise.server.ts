import { prisma } from "~/db.server";

export async function getExercise(id: string, userId: string) {
  return prisma.exercise.findFirst({
    where: {
      AND: [{ id }, { userId }],
    },
    select: {
      id: true,
      name: true,
      jointPain: true,
      muscleGroups: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getExercises(userId: string) {
  // Find the exercises that were created by the current user and the exercises that are public
  // which are available to everyone as predefined exercises.
  return prisma.exercise.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
    select: {
      id: true,
      name: true,
      jointPain: true,
      userId: true,
      muscleGroups: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getExercisesForAutocomplete(userId: string) {
  // Find the exercises that were created by the current user and the exercises that are public
  // which are available to everyone as predefined exercises.
  return prisma.exercise.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
    select: {
      id: true,
      name: true,
    },
  });
}
