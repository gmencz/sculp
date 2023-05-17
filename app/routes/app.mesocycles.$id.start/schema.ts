import { z } from "zod";

export const schema = z.object({
  startDate: z.coerce.date({
    invalid_type_error: "The start date is not valid.",
    required_error: "The start date is required.",
  }),
});

export type Schema = z.TypeOf<typeof schema>;
