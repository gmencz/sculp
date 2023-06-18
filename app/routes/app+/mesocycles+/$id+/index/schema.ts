import { z } from "zod";

export const schema = z.object({
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .min(1, "The name is required.")
    .max(1024, "The name must be at most 1024 characters long."),

  goal: z
    .string({
      invalid_type_error: "The goal is not valid.",
      required_error: "The goal is required.",
    })
    .min(1, "The goal is required.")
    .max(1024, "The goal must be at most 1024 characters long."),
});

export type Schema = z.TypeOf<typeof schema>;
