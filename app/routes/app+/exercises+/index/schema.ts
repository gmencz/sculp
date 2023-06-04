import { z } from "zod";

export const schema = z.object({
  deleteExercisesIds: z.array(
    z
      .string({
        invalid_type_error: "The exercise id is not valid.",
        required_error: "The exercise id is required.",
      })
      .max(25, "The exercise id must be at most 25 characters long."),
    { required_error: "The exercises ids are required." }
  ),
});

export type Schema = z.TypeOf<typeof schema>;

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
