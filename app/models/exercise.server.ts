import type { JointPain } from "@prisma/client";
import { redirect } from "@remix-run/server-runtime";
import { configRoutes } from "~/config-routes";
import { prisma } from "~/db.server";

type UpdateExerciseInput = {
  name: string;
  jointPain: string;
  muscleGroups: string[];
};

export async function updateExercise(
  id: string,
  userId: string,
  input: UpdateExerciseInput
) {
  const exercise = await prisma.exercise.findFirst({
    where: {
      AND: [{ id }, { userId }],
    },
    select: {
      id: true,
      muscleGroups: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!exercise) {
    throw new Response("Not found", { status: 404 });
  }

  const updatedExercise = await prisma.exercise.update({
    where: {
      id: exercise.id,
    },
    data: {
      name: { set: input.name },
      jointPain: { set: input.jointPain as JointPain },
      muscleGroups: {
        disconnect: exercise.muscleGroups.map(({ id }) => ({ id })),
        connect: input.muscleGroups.map((name) => ({ name })),
      },
    },
    select: { id: true },
  });

  return redirect(
    configRoutes.exerciseView(updatedExercise.id) +
      `?success_id=${new Date().getTime()}`
  );
}

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
