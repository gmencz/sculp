import { prisma } from "~/db.server";

export async function getMuscleGroups() {
  return prisma.muscleGroup.findMany({
    select: {
      name: true,
    },
  });
}
