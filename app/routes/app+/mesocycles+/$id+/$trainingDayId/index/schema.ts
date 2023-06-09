import { z } from "zod";
import {
  idSchema,
  notesSchema,
  repRangeSchema,
  rirSchema,
  trainingDayLabelSchema,
  weightSchema,
} from "~/utils/schemas";

export const actionIntents = [
  "update-set",
  "update-exercise",
  "add-set",
  "remove-exercise",
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
    .literal(actionIntents[2], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[2]),
});

export type AddSetSchema = z.TypeOf<typeof addSetSchema>;

export const updateExerciseSchema = z.object({
  id: idSchema,
  notes: notesSchema,
  actionIntent: z
    .literal(actionIntents[1], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[1]),
});

export type UpdateExerciseSchema = z.TypeOf<typeof updateExerciseSchema>;

export const updateSetSchema = z.object({
  id: idSchema,
  rir: rirSchema,
  weight: weightSchema,
  repRange: repRangeSchema,
  actionIntent: z
    .literal(actionIntents[0], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[0]),

  wantsToRemove: z.coerce.boolean({
    invalid_type_error: "The wants to delete value is not valid.",
    required_error: "The wants to delete value is required.",
  }),
});

export type UpdateSetSchema = z.TypeOf<typeof updateSetSchema>;

export const updateLabelSchema = z.object({
  label: trainingDayLabelSchema,
});

export type UpdateLabelSchema = z.TypeOf<typeof updateLabelSchema>;

export const removeExerciseSchema = z.object({
  id: idSchema,
  actionIntent: z
    .literal(actionIntents[3], {
      required_error: "The action intent is required",
      invalid_type_error: "The action intent is not valid",
    })
    .default(actionIntents[3]),
});

export type RemoveExerciseSchema = z.TypeOf<typeof removeExerciseSchema>;
