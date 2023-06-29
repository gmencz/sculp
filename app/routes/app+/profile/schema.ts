import { Theme, WeightUnit } from "@prisma/client";
import { z } from "zod";

export const preferencesSchema = z.object({
  name: z
    .string({ invalid_type_error: "The name is not valid." })
    .max(255, "The name is too long.")
    .refine(
      (value) => /^[a-zA-Z]+[-'s]?[a-zA-Z ]+$/.test(value),
      "Name should contain only alphabets"
    ),

  weightUnitPreference: z.nativeEnum(WeightUnit, {
    invalid_type_error: "The weight unit is not valid.",
    required_error: "The weight unit is required.",
  }),

  themePreference: z.nativeEnum(Theme, {
    invalid_type_error: "The theme is not valid.",
    required_error: "The theme is required.",
  }),
});

export type PreferencesSchema = z.infer<typeof preferencesSchema>;
