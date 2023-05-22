import { z } from "zod";
import { validateRepRange } from "~/utils";

export const exerciseSchema = z.object({
  id: z
    .string({
      invalid_type_error: "The id is not valid.",
      required_error: "The id is required.",
    })
    .length(25, "The id is not valid."),

  sets: z.array(
    z.object({
      id: z
        .string({
          invalid_type_error: "The set id is not valid.",
        })
        .length(25, "The set id is not valid")
        .optional(),

      rir: z.coerce
        .number({
          invalid_type_error: "The RIR is not valid.",
          required_error: "The RIR is required.",
        })
        .min(0, `The RIR can't be less than 0.`)
        .max(100, `The RIR can't be higher than 100.`),

      weight: z.coerce
        .number({
          invalid_type_error: "The weight is not valid.",
          required_error: "The weight is required.",
        })
        .min(0, `The weight must be greater than 0.`)
        .max(10000, `The weight can't be greater than 10000.`),

      repRange: z
        .string({
          invalid_type_error: "The rep range is not valid.",
        })
        .refine((repRange) => validateRepRange(repRange, true), {
          message: "The rep range is not valid.",
        }),

      completed: z.coerce.boolean({
        invalid_type_error: "The completed value is not valid.",
        required_error: "The completed value is required.",
      }),

      wantsToComplete: z.coerce.boolean({
        invalid_type_error: "The wants to complete value is not valid.",
        required_error: "The wants to complete value is required.",
      }),

      repsCompleted: z.coerce
        .number({
          invalid_type_error: "The reps completed is not valid.",
          required_error: "The reps completed is required.",
        })
        .min(0, `The reps completed can't be less than 0.`)
        .max(100, `The reps completed can't be greater than 100.`),
    })
  ),
});

export const updateSetSchema = z.object({
  id: z
    .string({
      invalid_type_error: "The id is not valid.",
    })
    .length(25, "The id is not valid")
    .optional(),

  rir: z.coerce
    .number({
      invalid_type_error: "The RIR is not valid.",
      required_error: "The RIR is required.",
    })
    .min(0, `The RIR can't be less than 0.`)
    .max(100, `The RIR can't be higher than 100.`),

  weight: z.coerce
    .number({
      invalid_type_error: "The weight is not valid.",
      required_error: "The weight is required.",
    })
    .min(0, `The weight must be greater than 0.`)
    .max(10000, `The weight can't be greater than 10000.`),

  repRange: z
    .string({
      invalid_type_error: "The rep range is not valid.",
      required_error: "The rep range is required.",
    })
    .refine(validateRepRange, {
      message: "The rep range is not valid.",
    }),

  completed: z.coerce.boolean({
    invalid_type_error: "The completed value is not valid.",
    required_error: "The completed value is required.",
  }),

  wantsToComplete: z.coerce.boolean({
    invalid_type_error: "The wants to complete value is not valid.",
    required_error: "The wants to complete value is required.",
  }),

  repsCompleted: z.coerce
    .number({
      invalid_type_error: "The reps completed is not valid.",
      required_error: "The reps completed is required.",
    })
    .min(0, `The reps completed can't be less than 0.`)
    .max(100, `The reps completed can't be greater than 100.`),
});

export type ExerciseSchema = z.TypeOf<typeof exerciseSchema>;
