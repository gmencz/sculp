import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  pushPullLegs3on1off,
  pushPullLegs6on1off,
} from "./seed/mesocycle-presets";
import {
  adductors,
  back,
  biceps,
  calves,
  chest,
  glutes,
  hamstrings,
  quads,
  shoulders,
  triceps,
} from "./seed/exercises";

const prisma = new PrismaClient();

async function seed() {
  const email = "admin@sculpedapp.com";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("hypertrophyiscool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Chest",
      exercises: {
        create: Object.values(chest).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Shoulders",
      exercises: {
        create: Object.values(shoulders).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Triceps",
      exercises: {
        create: Object.values(triceps).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Back",
      exercises: {
        create: Object.values(back).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Biceps",
      exercises: {
        create: Object.values(biceps).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Quads",
      exercises: {
        create: Object.values(quads).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Calves",
      exercises: {
        create: Object.values(calves).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Hamstrings",
      exercises: {
        create: Object.values(hamstrings).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Adductors",
      exercises: {
        create: Object.values(adductors).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  await prisma.muscleGroup.create({
    data: {
      name: "Glutes",
      exercises: {
        create: Object.values(glutes).map((name) => ({
          userId: user.id,
          name,
        })),
      },
    },
  });

  const presetMesocycleTemplates = [pushPullLegs3on1off, pushPullLegs6on1off];
  await Promise.all(
    presetMesocycleTemplates.map(async (template) => {
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
                      name_userId: {
                        name: exercise.name,
                        userId: user.id,
                      },
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
