import { z } from "zod";
import { TrackRir } from "~/routes/app+/profile/schema";
import { idSchema, notesSchema, routineNameSchema } from "~/utils/schemas";

export enum PreviousValuesFrom {
  ANY = "From any training session",
  SAME_ROUTINE = "From training sessions using this routine",
}

export enum Intent {
  UPDATE_ROUTINE_SETTINGS = "UPDATE_ROUTINE_SETTINGS",
  UPDATE_ROUTINE_DETAILS = "UPDATE_ROUTINE_DETAILS",
  REORDER_EXERCISES = "REORDER_EXERCISES",
  UPDATE_EXERCISE_NOTES = "UPDATE_EXERCISE_NOTES",
}

export const intentSchema = z.object({
  intent: z.nativeEnum(Intent, {
    invalid_type_error: "The intent is not valid.",
    required_error: "The intent is required.",
  }),
});

export type IntentSchema = z.infer<typeof intentSchema>;

export const updateRoutineDetailsSchema = z.object({
  intent: z
    .literal(Intent.UPDATE_ROUTINE_DETAILS)
    .default(Intent.UPDATE_ROUTINE_DETAILS),
  name: routineNameSchema,
  notes: notesSchema,
});

export type UpdateRoutineDetailsSchema = z.infer<
  typeof updateRoutineDetailsSchema
>;

export const reorderExercisesSchema = z.object({
  intent: z.literal(Intent.REORDER_EXERCISES).default(Intent.REORDER_EXERCISES),
  orderedExercisesIds: z.array(idSchema),
});

export type ReorderExercisesSchema = z.infer<typeof reorderExercisesSchema>;

export const updateExerciseNotesSchema = z.object({
  intent: z
    .literal(Intent.UPDATE_EXERCISE_NOTES)
    .default(Intent.UPDATE_EXERCISE_NOTES),
  notes: notesSchema,
});

export type UpdateExerciseNotesSchema = z.infer<
  typeof updateExerciseNotesSchema
>;

export const updateRoutineSettingsSchema = z.object({
  intent: z
    .literal(Intent.UPDATE_ROUTINE_SETTINGS)
    .default(Intent.UPDATE_ROUTINE_SETTINGS),

  trackRir: z.nativeEnum(TrackRir, {
    invalid_type_error: "The track rir value is not valid.",
    required_error: "The track rir value is required.",
  }),

  previousValuesFrom: z.nativeEnum(PreviousValuesFrom, {
    invalid_type_error: "The previous values from value is not valid.",
    required_error: "The previous values from value is required.",
  }),
});

export type UpdateRoutineSettingsSchema = z.infer<
  typeof updateRoutineSettingsSchema
>;
