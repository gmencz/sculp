import type { User } from "@prisma/client";
import { prisma } from "../db.server";
import {
  pushPullLegs3on1off,
  pushPullLegs6on1off,
} from "./mesocycle-presets/config";
import { exercises } from "./exercises";

/**
 * Creates the preset exercises and mesocycles for a user.
 * @param id The user id.
 */
export async function seedUserById(id: User["id"]) {
  await Promise.all(
    Object.keys(exercises).map((exerciseName) => {
      const muscleGroups = exercises[exerciseName as keyof typeof exercises];

      return prisma.exercise.create({
        data: {
          name: exerciseName,
          user: { connect: { id } },
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
                        userId: id,
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
}
