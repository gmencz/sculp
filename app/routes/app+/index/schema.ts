import { z } from "zod";
import {
  idSchema,
  notesSchema,
  rirSchema,
  weightSchema,
} from "~/utils/schemas";

export const actionIntents = [
  "update-set",
  "finish-or-update-session",
  "update-exercise",
  "add-set",
] as const;

export const schema = z.object({
  actionIntent: z.enum(actionIntents, {
    required_error: "The action intent is required",
    invalid_type_error: "The action intent is not valid",
  }),
});

export type Schema = z.TypeOf<typeof schema>;

export const addSetSchema = z.object({
  id: idSchema,
  setId: idSchema,
  actionIntent: z
    .literal(actionIntents[3], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[3]),
});

export type AddSetSchema = z.TypeOf<typeof addSetSchema>;

export const updateExerciseSchema = z.object({
  id: idSchema,
  notes: notesSchema,
  actionIntent: z
    .literal(actionIntents[2], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[2]),
});

export type UpdateExerciseSchema = z.TypeOf<typeof updateExerciseSchema>;

export const updateSetSchema = z.object({
  id: idSchema,
  rir: rirSchema,
  weight: weightSchema,

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

  wantsToRemove: z.coerce.boolean({
    invalid_type_error: "The wants to delete value is not valid.",
    required_error: "The wants to delete value is required.",
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

export const finishOrUpdateSessionSchema = z.object({
  id: idSchema,

  feedback: z
    .string({ invalid_type_error: "The feedback is not valid." })
    .max(4096, "The feedback must be less than 4096 characters long."),

  actionIntent: z
    .literal(actionIntents[1], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[1]),
});

export type FinishOrUpdateSessionSchema = z.TypeOf<
  typeof finishOrUpdateSessionSchema
>;
