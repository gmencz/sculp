import { endOfToday, isAfter } from "date-fns";
import { z } from "zod";

export const schema = z.object({
  startDate: z.coerce
    .date({
      errorMap: (issue, ctx) => {
        if (issue.code === "invalid_date") {
          return { message: "The start date is not valid." };
        }

        return { message: ctx.defaultError };
      },
    })
    .refine((date) => {
      const today = endOfToday();
      return isAfter(date, today);
    }, "The start date must be after today."),

  linkPreviousRun: z
    .string()
    .transform((value) => value === "on")
    .default("off"),

  progressiveRir: z
    .string()
    .transform((value) => value === "on")
    .default("off"),
});

export type Schema = z.TypeOf<typeof schema>;
