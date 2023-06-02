import { z } from "zod";
import {
  dayNumberSchema,
  idSchema,
  repRangeSchema,
  rirSchema,
  trainingDayLabelSchema,
  weightSchema,
} from "~/utils/schemas";

export const schema = z.object({
  trainingDays: z.array(
    z.object({
      label: trainingDayLabelSchema,

      exercises: z
        .array(
          z.object({
            sets: z
              .array(
                z.object({
                  rir: rirSchema,
                  weight: weightSchema,
                  repRange: repRangeSchema,
                }),
                { required_error: "You must add at least 1 set." }
              )
              .min(1, `You must add at least 1 set.`)
              .max(10, `The sets must be at most 10.`),

            id: idSchema,

            notes: z
              .string({
                invalid_type_error: "The notes are not valid.",
              })
              .optional(),

            dayNumber: dayNumberSchema,
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

      dayNumber: dayNumberSchema,
    })
  ),
});

export type Schema = z.infer<typeof schema>;
