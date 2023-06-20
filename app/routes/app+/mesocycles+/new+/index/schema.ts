import { z } from "zod";

export const durationInMicrocyclesArray = [1, 2, 3, 4, 5, 6, 7, 8];

export const trainingDaysPerMicrocycleArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export enum WeightUnitPreference {
  kgs = "kgs",
  lbs = "lbs",
}

export const schema = z.object({
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .min(1, "The name is required.")
    .max(1024, "The name must be at most 1024 characters long."),

  presetName: z
    .string({ invalid_type_error: "The preset name is not valid." })
    .optional(),

  weightUnitPreference: z.nativeEnum(WeightUnitPreference, {
    required_error: "The prefered weight unit is required",
    invalid_type_error: "The prefered weight unit is not valid",
  }),

  durationInMicrocycles: z.coerce
    .number({
      invalid_type_error: "The selected microcycles are not valid.",
      required_error: "The selected microcycles are required.",
    })
    .min(
      durationInMicrocyclesArray[0],
      `The selected microcycles must be at least ${durationInMicrocyclesArray[0]}.`
    )
    .max(
      durationInMicrocyclesArray[durationInMicrocyclesArray.length - 1],
      `The selected microcycles must be at most ${
        durationInMicrocyclesArray[durationInMicrocyclesArray.length - 1]
      }.`
    ),

  trainingDaysPerMicrocycle: z
    .array(
      z.coerce.number({
        invalid_type_error: "The training day is not valid.",
        required_error: "The training day is required.",
      }),
      {
        invalid_type_error: "The selected training days are not valid.",
        required_error: "You must select at least 1 training day.",
      }
    )
    .min(1, "You must select at least 1 training day.")
    .max(
      7,
      "You can't select more than 7 training days, this is to avoid overtraining."
    ),

  restDaysPerMicrocycle: z
    .array(
      z.coerce.number({
        invalid_type_error: "The rest day is not valid.",
        required_error: "The rest day is required.",
      }),
      {
        invalid_type_error: "The selected rest days are not valid.",
        required_error: "You must select at least 1 rest day.",
      }
    )
    .min(1, "You must select at least 1 rest day.")
    .max(9, "You can't select more than 9 days."),

  goal: z
    .string({
      invalid_type_error: "The goal is not valid.",
      required_error: "The goal is required.",
    })
    .min(1, "The goal is required.")
    .max(1024, "The goal must be at most 1024 characters long."),
});

export type Schema = z.infer<typeof schema>;
