import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  pushPullLegs3on1off,
  pushPullLegs6on1off,
} from "~/utils/user/mesocycle-presets/config";
import { MuscleGroup, exercises } from "~/utils/user/exercises";

const prisma = new PrismaClient();

async function seed() {
  const email = "dev@sculped.app";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("password123", 10);

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

  await Promise.all(
    Object.values(MuscleGroup).map((muscleGroup) =>
      prisma.muscleGroup.create({
        data: {
          name: muscleGroup,
        },
      })
    )
  );

  await Promise.all(
    Object.keys(exercises).map((exerciseName) => {
      const muscleGroups = exercises[exerciseName as keyof typeof exercises];

      return prisma.exercise.create({
        data: {
          name: exerciseName,
          user: { connect: { id: user.id } },
          muscleGroups: {
            connect: muscleGroups.map((muscleGroup) => ({ name: muscleGroup })),
          },
        },
      });
    })
  );

  const presetMesocycleTemplates = [pushPullLegs3on1off, pushPullLegs6on1off];
  await Promise.all(
    presetMesocycleTemplates.map(async (template) => {
      return prisma.mesocyclePreset.create({
        data: {
          name: template.name,
          microcycles: template.microcycles,
          userId: user.id,
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
