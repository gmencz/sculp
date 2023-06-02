import { z } from "zod";

export const schema = z.object({
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .min(1, "The name is required.")
    .max(100, "The name must be at most 100 characters long."),

  muscleGroups: z
    .array(
      z
        .string({
          invalid_type_error: "The muscle group is not valid.",
          required_error: "The muscle group is required.",
        })
        .min(1, "The muscle group is required.")
        .max(50, "The muscle group must be at most 50 characters long.")
    )
    .min(1, "You must add at least 1 muscle group.")
    .max(10, "You can't add more than 10 muscle groups to a given exercise."),
});

export type Schema = z.TypeOf<typeof schema>;
