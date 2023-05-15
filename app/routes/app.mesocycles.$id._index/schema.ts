import { z } from "zod";
import { validateRepRange } from "~/utils";

export const schema = z.object({
  trainingDays: z.array(
    z.object({
      id: z
        .string({
          invalid_type_error: "The day id is not valid.",
          required_error: "The day id is required.",
        })
        .min(1, "The day id is required.")
        .max(25, "The day id must be at most 25 characters long."),

      label: z
        .string({
          invalid_type_error: "The label is not valid.",
          required_error: "The label is required.",
        })
        .min(1, "The label is required.")
        .max(50, "The label must be at most 50 characters long."),

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
                  id: z
                    .string({
                      invalid_type_error: "The set id is not valid.",
                    })
                    .max(25, "The set id must be at most 25 characters long.")
                    .nullable(),

                  rir: z.coerce
                    .number({
                      invalid_type_error: "The RIR is not valid.",
                      required_error: "The RIR is required.",
                    })
                    .min(0, `The RIR can't be lower than 0.`)
                    .max(100, `The RIR can't be higher than 100.`),

                  weight: z.coerce
                    .number({
                      invalid_type_error: "The weight is not valid.",
                      required_error: "The weight is required.",
                    })
                    .min(1, `The weight must be greater than 0.`)
                    .max(10000, `The weight can't be greater than 10000.`),

                  repRange: z
                    .string({
                      invalid_type_error: "The rep range is not valid.",
                      required_error: "The rep range is required.",
                    })
                    .min(1, "The rep range is required.")
                    .refine(validateRepRange, {
                      message: "The rep range is not valid.",
                    }),
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

            notes: z
              .string({
                invalid_type_error: "The notes are not valid.",
              })
              .optional(),
          }),
          {
            required_error: "You must add at least 1 exercise.",
          }
        )
        .min(1, "You must add at least 1 exercise.")
        .max(
          8,
          "You can't add more than 7 exercises on a given day, this is to prevent junk volume."
        ),
    })
  ),
});

export type Schema = z.TypeOf<typeof schema>;
