import { z } from "zod";
import { exerciseNameSchema, muscleGroupsSchema } from "~/utils/schemas";

export const schema = z.object({
  name: exerciseNameSchema,
  muscleGroups: muscleGroupsSchema,
});

export type Schema = z.TypeOf<typeof schema>;
