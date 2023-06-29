// ********************************************************************************************
// IMPORTANT:
// Run this command locally against the production database by proxying it through WireGuard.
// ********************************************************************************************

import { PrismaClient, Role } from "@prisma/client";
import { stripe } from "~/services/stripe/config.server";
import { hashPassword } from "~/utils/encryption.server";
import { env } from "~/utils/env.server";
import { exercises } from "~/utils/user/exercises";
import { MuscleGroup } from "~/utils/user/exercises";

const prisma = new PrismaClient();

async function seed() {
  if (
    !env.PRISMA_SEED_ADMIN_EMAIL ||
    !env.PRISMA_SEED_ADMIN_PASSWORD ||
    !env.PRISMA_SEED_ADMIN_STRIPE_CUSTOMER_ID ||
    !env.PRISMA_SEED_ADMIN_STRIPE_SUBSCRIPTION_ID
  ) {
    throw new Error(
      "PRISMA_SEED_ADMIN_EMAIL, PRISMA_SEED_ADMIN_PASSWORD, PRISMA_SEED_ADMIN_STRIPE_CUSTOMER_ID and PRISMA_SEED_ADMIN_STRIPE_SUBSCRIPTION_ID  are required environment variable."
    );
  }

  const hashedPassword = await hashPassword(env.PRISMA_SEED_ADMIN_PASSWORD);

  const subscription = await stripe.subscriptions.retrieve(
    env.PRISMA_SEED_ADMIN_STRIPE_SUBSCRIPTION_ID
  );

  if (!subscription) {
    throw new Error("Failed to retrieve subscription from Stripe.");
  }

  const currentSharedExercises = await prisma.exercise.findMany({
    where: {
      shared: true,
    },
    select: {
      name: true,
    },
  });

  const exercisesToCreate = Object.keys(exercises)
    .filter(
      (exerciseName) =>
        !currentSharedExercises.some((exercise) => exercise.name)
    )
    .reduce((acc, key) => {
      return {
        ...acc,
        [key]: exercises[key as keyof typeof exercises],
      };
    }, {} as typeof exercises);

  await prisma.$transaction([
    // Admin user.
    prisma.user.upsert({
      where: {
        email: env.PRISMA_SEED_ADMIN_EMAIL,
      },
      update: {},
      create: {
        email: env.PRISMA_SEED_ADMIN_EMAIL,
        role: Role.ADMIN,
        stripeCustomerId: env.PRISMA_SEED_ADMIN_STRIPE_CUSTOMER_ID,
        subscription: {
          create: {
            id: subscription.id,
            currentPeriodEnd: subscription.current_period_end,
            currentPeriodStart: subscription.current_period_start,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        },
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
    }),

    // Muscle groups.
    ...Object.values(MuscleGroup).map((muscleGroup) =>
      prisma.muscleGroup.upsert({
        where: {
          name: muscleGroup,
        },
        update: {},
        create: {
          name: muscleGroup,
        },
      })
    ),

    // Create exercises.
    ...Object.keys(exercisesToCreate).map((exerciseName) => {
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
    mesocyclePresets.map((preset) => {
      return prisma.mesocyclePreset.upsert({
        where: {
          name: preset.name,
        },
        update: {},
        create: {
          name: preset.name,
          microcycles: preset.microcycles,
          restDays: { set: preset.restDays },
          trainingDays: {
            create: preset.trainingDays.map((trainingDay) => ({
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
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
