import { z } from "zod";
import { validateRepRange } from "~/utils";

export const schema = z.object({
  trainingDays: z.array(
    z.object({
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
            sets: z
              .array(
                z.object({
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
                    })
                    .min(1, `The weight must be greater than 0.`)
                    .max(10000, `The weight can't be greater than 10000.`)
                    .optional(),

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

            id: z
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

            dayNumber: z.coerce
              .number({
                invalid_type_error: "The day number is not valid.",
                required_error: "The day number is required.",
              })
              .min(1, `The day number must be at least 1.`)
              .max(10, `The day number can't be greater than 6.`),
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

      dayNumber: z.coerce
        .number({
          invalid_type_error: "The day number is not valid.",
          required_error: "The day number is required.",
        })
        .min(1, `The day number must be at least 1.`)
        .max(10, `The day number can't be greater than 6.`),
    })
  ),
});

export type Schema = z.infer<typeof schema>;
