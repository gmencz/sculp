import { redirect } from "@remix-run/server-runtime";
import { configRoutes } from "~/config-routes";
import { prisma } from "~/db.server";
import { generateId } from "~/utils";

export async function findExerciseByNameUserId(name: string, userId: string) {
  return prisma.exercise.findUnique({
    where: {
      name_userId: {
        name,
        userId,
      },
    },
    select: {
      name: true,
    },
  });
}

export async function deleteExercises(ids: string[], userId: string) {
  return prisma.exercise.deleteMany({
    where: {
      AND: [{ userId }, { id: { in: ids } }],
    },
  });
}

type CreateExerciseInput = {
  name: string;
  muscleGroups: string[];
};

export async function createExercise(
  userId: string,
  input: CreateExerciseInput
) {
  await prisma.exercise.create({
    data: {
      name: input.name,
      userId,
      muscleGroups: {
        connect: input.muscleGroups.map((name) => ({ name })),
      },
    },
    select: { id: true },
  });

  return redirect(configRoutes.exercises.list);
}

type UpdateExerciseInput = {
  name: string;
  muscleGroups: string[];
};

export async function updateExercise(
  url: URL,
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
      muscleGroups: {
        disconnect: exercise.muscleGroups.map(({ id }) => ({ id })),
        connect: input.muscleGroups.map((name) => ({ name })),
      },
    },
    select: { id: true },
  });

  url.searchParams.set("success_id", generateId());

  return redirect(configRoutes.exercises.view(updatedExercise.id) + url.search);
}

export async function getExercise(id: string, userId: string) {
  return prisma.exercise.findFirst({
    where: {
      AND: [{ id }, { userId }],
    },
    select: {
      id: true,
      name: true,
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

export async function getExercises(userId: string, query?: string | null) {
  if (query) {
    query = query
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" | ");
  }

  return prisma.exercise.findMany({
    where: query
      ? {
          AND: [
            { userId },
            {
              OR: [
                { name: { search: query } },
                {
                  muscleGroups: { some: { name: { search: query } } },
                },
              ],
            },
          ],
        }
      : {
          userId,
        },
    select: {
      id: true,
      name: true,
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
