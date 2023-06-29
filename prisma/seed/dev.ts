import { PrismaClient, Role } from "@prisma/client";
import { MuscleGroup, exercises } from "~/utils/user/exercises";
import { hashPassword } from "~/utils/encryption.server";

const prisma = new PrismaClient();

async function seed() {
  const email = "dev@sculped.app";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await hashPassword("password123");

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email,
        role: Role.ADMIN,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
    }),

    // Create muscle groups.
    ...Object.values(MuscleGroup).map((muscleGroup) =>
      prisma.muscleGroup.create({
        data: {
          name: muscleGroup,
        },
      })
    ),

    // Create exercises.
    ...Object.keys(exercises).map((exerciseName) => {
      const muscleGroups = exercises[exerciseName as keyof typeof exercises];

      return prisma.exercise.create({
        data: {
          name: exerciseName,
          shared: true,
          primaryMuscleGroups: {
            connect: muscleGroups.primary.map((muscleGroup) => ({
              name: muscleGroup,
            })),
          },
          otherMuscleGroups: {
            connect: muscleGroups.other.map((muscleGroup) => ({
              name: muscleGroup,
            })),
          },
        },
      });
    }),
  ]);

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
