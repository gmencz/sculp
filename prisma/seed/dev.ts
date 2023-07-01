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

  const user = await prisma.user.create({
    data: {
      email,
      role: Role.ADMIN,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  const dbExercises = await prisma.exercise.findMany();

  await prisma.folder.create({
    data: {
      userId: user.id,
      name: "PPL",
      order: 1,
      notes:
        "Push pull legs (3 days on 1 off) with an emphasis on biceps, quads and chest.",
      routines: {
        create: [
          {
            name: "Push A",
            userId: user.id,
            trackRir: false,
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Flat Bench Press (Barbell)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 2,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Lateral Raise (Cable)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 3,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Triceps Pushdown (Cable)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
              ],
            },
          },
          {
            name: "Pull A",
            userId: user.id,
            trackRir: false,
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Lat Pulldown (Cable)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 2,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "T-Bar Row (Machine)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 3,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Preacher Curl (Machine)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.folder.create({
    data: {
      userId: user.id,
      name: "PPL 2",
      order: 1,
      notes:
        "Push pull legs (3 days on 1 off) with an emphasis on biceps, quads and chest.",
      routines: {
        create: [
          {
            name: "Push A",
            userId: user.id,
            trackRir: false,
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Flat Bench Press (Barbell)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 2,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Lateral Raise (Cable)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 3,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Triceps Pushdown (Cable)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
              ],
            },
          },
          {
            name: "Pull A",
            userId: user.id,
            trackRir: false,
            exercises: {
              create: [
                {
                  order: 1,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Lat Pulldown (Cable)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 2,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "T-Bar Row (Machine)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
                {
                  order: 3,
                  exerciseId: dbExercises.find(
                    (e) => e.name === "Preacher Curl (Machine)"
                  )!.id,
                  sets: {
                    create: [{ number: 1 }, { number: 2 }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

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
