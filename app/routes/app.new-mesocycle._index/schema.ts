import { z } from "zod";

export const durationInWeeksArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const trainingDaysPerWeekArray = [1, 2, 3, 4, 5, 6];

export const schema = z.object({
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .min(1, "The name is required.")
    .max(1024, "The name must be at most 1024 characters long."),

  durationInWeeks: z.coerce
    .number({
      invalid_type_error: "The selected weeks are not valid.",
      required_error: "The selected weeks are required.",
    })
    .min(
      durationInWeeksArray[0],
      `The selected weeks must be at least ${durationInWeeksArray[0]}.`
    )
    .max(
      durationInWeeksArray[durationInWeeksArray.length - 1],
      `The selected weeks must be at most ${
        durationInWeeksArray[durationInWeeksArray.length - 1]
      }.`
    ),

  trainingDaysPerWeek: z.coerce
    .number({
      invalid_type_error: "The selected days are not valid.",
      required_error: "The selected days are required.",
    })
    .min(
      trainingDaysPerWeekArray[0],
      `The selected days must be at least ${trainingDaysPerWeekArray[0]}.`
    )
    .max(
      trainingDaysPerWeekArray[trainingDaysPerWeekArray.length - 1],
      `The selected days must be at most ${
        trainingDaysPerWeekArray[trainingDaysPerWeekArray.length - 1]
      }.`
    ),

  goal: z
    .string({
      invalid_type_error: "The goal is not valid.",
      required_error: "The goal is required.",
    })
    .min(1, "The goal is required.")
    .max(1024, "The goal must be at most 1024 characters long."),
});

export type Schema = z.infer<typeof schema>;
