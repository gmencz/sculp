import { z } from "zod";
import { TrackRir } from "~/routes/app+/profile/schema";
import {
  idSchema,
  notesSchema,
  repsSchema,
  rirSchema,
  routineNameSchema,
  setTypeSchema,
  validateMinutesAndSeconds,
  weightSchema,
} from "~/utils/schemas";

export enum PreviousValuesFrom {
  ANY = "From any session",
  SAME_ROUTINE = "From this routine only",
}

export enum Intent {
  UPDATE_ROUTINE_SETTINGS = "UPDATE_ROUTINE_SETTINGS",
  UPDATE_ROUTINE_DETAILS = "UPDATE_ROUTINE_DETAILS",
  REORDER_EXERCISES = "REORDER_EXERCISES",
  UPDATE_EXERCISE_NOTES = "UPDATE_EXERCISE_NOTES",
  UPDATE_SET = "UPDATE_SET",
  REMOVE_SET = "REMOVE_SET",
  ADD_SET = "ADD_SET",
  REMOVE_EXERCISE = "REMOVE_EXERCISE",
  UPDATE_EXERCISE_REST_TIMER = "UPDATE_EXERCISE_REST_TIMER",
  ADD_EXERCISE_TO_SUPERSET = "ADD_EXERCISE_TO_SUPERSET",
  REMOVE_EXERCISE_FROM_SUPERSET = "REMOVE_EXERCISE_FROM_SUPERSET",
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
  id: idSchema,
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

export const updateSetSchema = z.object({
  intent: z.literal(Intent.UPDATE_SET).default(Intent.UPDATE_SET),
  id: idSchema,
  weight: weightSchema,
  reps: repsSchema,
  rir: rirSchema,
  type: setTypeSchema,
});

export type UpdateSetSchema = z.infer<typeof updateSetSchema>;

export const removeSetSchema = z.object({
  intent: z.literal(Intent.REMOVE_SET).default(Intent.REMOVE_SET),
  id: idSchema,
});

export type RemoveSetSchema = z.infer<typeof removeSetSchema>;

export const addSetSchema = z.object({
  intent: z.literal(Intent.ADD_SET).default(Intent.ADD_SET),
  exerciseId: idSchema,
});

export type AddSetSchema = z.infer<typeof addSetSchema>;

export const removeExerciseSchema = z.object({
  intent: z.literal(Intent.REMOVE_EXERCISE).default(Intent.REMOVE_EXERCISE),
  id: idSchema,
});

export type RemoveExerciseSchema = z.infer<typeof removeExerciseSchema>;

export const updateExerciseRestTimersSchema = z.object({
  intent: z
    .literal(Intent.UPDATE_EXERCISE_REST_TIMER)
    .default(Intent.UPDATE_EXERCISE_REST_TIMER),
  id: idSchema,
  normalRestTimer: z.literal("off").or(
    z
      .string({
        invalid_type_error: "The normal rest timer is not valid.",
      })
      .refine(validateMinutesAndSeconds, {
        message: "The normal rest timer not valid.",
      })
  ),

  warmUpRestTimer: z.literal("off").or(
    z
      .string({
        invalid_type_error: "The warm up rest timer is not valid.",
      })
      .refine(validateMinutesAndSeconds, {
        message: "The warm up rest timer not valid.",
      })
  ),
});

export type UpdateExerciseRestTimersSchema = z.infer<
  typeof updateExerciseRestTimersSchema
>;

export const addExerciseToSupersetSchema = z.object({
  intent: z
    .literal(Intent.ADD_EXERCISE_TO_SUPERSET)
    .default(Intent.ADD_EXERCISE_TO_SUPERSET),
  id: idSchema,
  withId: idSchema,
});

export type AddExerciseToSupersetSchema = z.infer<
  typeof addExerciseToSupersetSchema
>;

export const removeExerciseFromSupersetSchema = z.object({
  intent: z
    .literal(Intent.REMOVE_EXERCISE_FROM_SUPERSET)
    .default(Intent.REMOVE_EXERCISE_FROM_SUPERSET),
  id: idSchema,
  supersetId: idSchema,
});

export type RemoveExerciseFromSupersetSchema = z.infer<
  typeof removeExerciseFromSupersetSchema
>;
