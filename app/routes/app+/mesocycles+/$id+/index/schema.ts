import { z } from "zod";
import {
  dayNumberSchema,
  idSchema,
  notesSchema,
  repRangeSchema,
  rirSchema,
  trainingDayLabelSchema,
  weightSchema,
} from "~/utils/schemas";

export const schema = z.object({
  trainingDays: z.array(
    z.object({
      id: idSchema,
      label: trainingDayLabelSchema,
      dayNumber: dayNumberSchema,

      exercises: z
        .array(
          z.object({
            id: z
              .string({
                invalid_type_error: "The exercise id is not valid.",
              })
              .max(25, "The exercise id must be at most 25 characters long.")
              .nullable(),

            sets: z
              .array(
                z.object({
                  id: idSchema.nullable(),
                  rir: rirSchema,
                  weight: weightSchema,
                  repRange: repRangeSchema,
                }),
                { required_error: "You must add at least 1 set." }
              )
              .min(1, `You must add at least 1 set.`)
              .max(10, `The sets must be at most 10.`),

            searchedExerciseId: z
              .string({
                invalid_type_error: "The exercise is not valid.",
                required_error: "The exercise is required.",
              })
              .min(1, "The exercise is required."),

            notes: notesSchema,
          }),
          {
            required_error: "You must add at least 1 exercise.",
          }
        )
        .min(1, "You must add at least 1 exercise.")
        .max(
          7,
          "You can't add more than 7 exercises on a given day, this is to prevent junk volume."
        ),
    })
  ),
});

export type Schema = z.TypeOf<typeof schema>;
