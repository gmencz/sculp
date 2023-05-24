import { z } from "zod";
import { validateRepRange } from "~/utils";

export const actionIntents = [
  "update-set",
  "finish-session",
  "update-exercise",
] as const;

export const schema = z.object({
  actionIntent: z.enum(actionIntents, {
    required_error: "The action intent is required",
    invalid_type_error: "The action intent is not valid",
  }),
});

export const updateExerciseSchema = z.object({
  id: z
    .string({
      invalid_type_error: "The id is not valid.",
    })
    .length(25, "The id is not valid"),

  notes: z
    .string({
      invalid_type_error: "The notes are not valid.",
    })
    .optional(),

  actionIntent: z
    .literal(actionIntents[2], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[2]),
});

export type UpdateExerciseSchema = z.TypeOf<typeof updateExerciseSchema>;

export const updateSetSchema = z.object({
  id: z
    .string({
      invalid_type_error: "The id is not valid.",
    })
    .length(25, "The id is not valid"),

  rir: z.coerce
    .number({
      invalid_type_error: "The RIR is not valid.",
      required_error: "The RIR is required.",
    })
    .min(0, `The RIR can't be less than 0.`)
    .max(100, `The RIR can't be higher than 100.`),

  weight: z.coerce
    .number({
      invalid_type_error: "The weight is not valid.",
      required_error: "The weight is required.",
    })
    .min(0, `The weight must be greater than 0.`)
    .max(10000, `The weight can't be greater than 10000.`),

  repRange: z
    .string({
      invalid_type_error: "The rep range is not valid.",
      required_error: "The rep range is required.",
    })
    .refine(validateRepRange, {
      message: "The rep range is not valid.",
    }),

  completed: z.coerce.boolean({
    invalid_type_error: "The completed value is not valid.",
    required_error: "The completed value is required.",
  }),

  actionIntent: z
    .literal(actionIntents[0], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[0]),

  wantsToComplete: z.coerce.boolean({
    invalid_type_error: "The wants to complete value is not valid.",
    required_error: "The wants to complete value is required.",
  }),

  repsCompleted: z.coerce
    .number({
      invalid_type_error: "The reps completed is not valid.",
      required_error: "The reps completed is required.",
    })
    .min(0, `The reps completed can't be less than 0.`)
    .max(100, `The reps completed can't be greater than 100.`),
});

export type UpdateSetSchema = z.TypeOf<typeof updateSetSchema>;
