import { PrismaClient, Role } from "@prisma/client";
import { mesocyclePresets } from "~/utils/user/mesocycle-presets";
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
          muscleGroups: {
            connect: muscleGroups.map((muscleGroup) => ({ name: muscleGroup })),
          },
        },
      });
    }),
  ]);

  const sharedExercises = await prisma.exercise.findMany({
    where: {
      shared: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  await prisma.$transaction(
    mesocyclePresets.map((template) => {
      return prisma.mesocyclePreset.create({
        data: {
          name: template.name,
          microcycles: template.microcycles,
          restDays: { set: template.restDays },
          trainingDays: {
            create: template.trainingDays.map((trainingDay) => ({
              label: trainingDay.label,
              number: trainingDay.number,
              exercises: {
                create: trainingDay.exercises.map((exercise, index) => ({
                  number: index + 1,
                  notes: exercise.notes,
                  exercise: {
                    connect: {
                      id: sharedExercises.find(
                        ({ name }) => name === exercise.name
                      )!.id,
                    },
                  },
                  sets: {
                    create: exercise.sets.map((set, index) => ({
                      number: index + 1,
                      rir: set.rir,
                      repRangeLowerBound: set.repRangeLowerBound,
                      repRangeUpperBound: set.repRangeUpperBound,
                    })),
                  },
                })),
              },
            })),
          },
        },
      });
    })
  );

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
