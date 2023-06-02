import { endOfToday, isAfter, isToday } from "date-fns";
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
      return isToday(date) || isAfter(date, today);
    }, "The start date must be today or later."),
});

export type Schema = z.TypeOf<typeof schema>;
