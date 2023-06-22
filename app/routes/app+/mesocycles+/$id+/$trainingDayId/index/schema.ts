import { z } from "zod";
import {
  idSchema,
  notesSchema,
  repRangeSchema,
  rirSchema,
  trainingDayLabelSchema,
  weightSchema,
} from "~/utils/schemas";

export enum ActionIntents {
  UpdateSet = "UPDATE_SET",
  AddSet = "ADD_SET",
  RemoveSet = "REMOVE_SET",
  UpdateExerciseNotes = "UPDATE_EXERCISE_NOTES",
  RemoveExercise = "REMOVE_EXERCISE",
  UpdateTrainingDayLabel = "UPDATE_TRAINING_DAY_LABEL",
  ReorderExercises = "REORDER_EXERCISES",
}

export const intentSchema = z.object({
  actionIntent: z.nativeEnum(ActionIntents, {
    required_error: "The action intent is required",
    invalid_type_error: "The action intent is not valid",
  }),
});

export type IntentSchema = z.TypeOf<typeof intentSchema>;

export const updateSetSchema = z.object({
  id: idSchema,
  rir: rirSchema,
  weight: weightSchema,
  repRange: repRangeSchema,
  actionIntent: z
    .literal(ActionIntents.UpdateSet)
    .default(ActionIntents.UpdateSet),
});

export type UpdateSetSchema = z.TypeOf<typeof updateSetSchema>;

export const addSetSchema = z.object({
  id: idSchema,
  setId: idSchema,
  actionIntent: z.literal(ActionIntents.AddSet).default(ActionIntents.AddSet),
});

export type AddSetSchema = z.TypeOf<typeof addSetSchema>;

export const removeSetSchema = z.object({
  id: idSchema,
  actionIntent: z
    .literal(ActionIntents.RemoveSet)
    .default(ActionIntents.RemoveSet),
});

export type RemoveSetSchema = z.TypeOf<typeof removeSetSchema>;

export const updateExerciseNotesSchema = z.object({
  id: idSchema,
  notes: notesSchema,
  actionIntent: z
    .literal(ActionIntents.UpdateExerciseNotes)
    .default(ActionIntents.UpdateExerciseNotes),
});

export type UpdateExerciseNotesSchema = z.TypeOf<
  typeof updateExerciseNotesSchema
>;

export const removeExerciseSchema = z.object({
  id: idSchema,
  actionIntent: z
    .literal(ActionIntents.RemoveExercise)
    .default(ActionIntents.RemoveExercise),
});

export type RemoveExerciseSchema = z.TypeOf<typeof removeExerciseSchema>;

export const updateTrainingDayLabelSchema = z.object({
  label: trainingDayLabelSchema,
  actionIntent: z
    .literal(ActionIntents.UpdateTrainingDayLabel)
    .default(ActionIntents.UpdateTrainingDayLabel),
});

export type UpdateTrainingDayLabelSchema = z.TypeOf<
  typeof updateTrainingDayLabelSchema
>;

export const reorderExercisesSchema = z.object({
  orderedExercisesIds: z.array(idSchema),
  actionIntent: z
    .literal(ActionIntents.ReorderExercises)
    .default(ActionIntents.ReorderExercises),
});

export type ReorderExercisesSchema = z.TypeOf<typeof reorderExercisesSchema>;
