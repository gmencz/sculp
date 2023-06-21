import { z } from "zod";
import { WeightUnitPreference } from "../../new+/index/schema";

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

  weightUnitPreference: z.nativeEnum(WeightUnitPreference, {
    required_error: "The prefered weight unit is required",
    invalid_type_error: "The prefered weight unit is not valid",
  }),
});

export type Schema = z.TypeOf<typeof schema>;
