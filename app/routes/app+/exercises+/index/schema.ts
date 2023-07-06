import { z } from "zod";
import { idSchema } from "~/utils/schemas";

export const searchSchema = z.object({
  query: z
    .string({
      invalid_type_error: "The query is not valid.",
      required_error: "The query is required.",
    })
    .refine(
      (query) => {
        if (query === "") return true;
        if (query.length > 100) return false;
        return /^[a-z0-9\s]+$/i.test(query);
      },
      { message: "The query is not valid." }
    ),
});

export type SearchSchema = z.TypeOf<typeof searchSchema>;

export enum Intent {
  ADD_EXERCISE_TO_ROUTINE = "ADD_EXERCISE_TO_ROUTINE",
  REPLACE_EXERCISE_FROM_ROUTINE = "REPLACE_EXERCISE_FROM_ROUTINE",
}

export const intentSchema = z.object({
  intent: z.nativeEnum(Intent, {
    invalid_type_error: "The intent is not valid.",
    required_error: "The intent is required.",
  }),
});

export type IntentSchema = z.infer<typeof intentSchema>;

export const addExerciseToRoutineSchema = z.object({
  intent: z
    .literal(Intent.ADD_EXERCISE_TO_ROUTINE)
    .default(Intent.ADD_EXERCISE_TO_ROUTINE),
  routineId: idSchema,
  exerciseId: idSchema,
});

export type AddExerciseToRoutineSchema = z.infer<
  typeof addExerciseToRoutineSchema
>;

export const replaceExerciseFromRoutineSchema = z.object({
  intent: z
    .literal(Intent.REPLACE_EXERCISE_FROM_ROUTINE)
    .default(Intent.REPLACE_EXERCISE_FROM_ROUTINE),
  routineId: idSchema,
  exerciseId: idSchema,
  replaceExerciseId: idSchema,
});

export type ReplaceExerciseFromRoutineSchema = z.infer<
  typeof replaceExerciseFromRoutineSchema
>;
