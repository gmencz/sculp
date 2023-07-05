import { z } from "zod";
import { asNullableField } from "./zod";
import { SetType } from "@prisma/client";

export const trainingDayLabelSchema = z
  .string({
    invalid_type_error: "The label is not valid.",
    required_error: "The label is required.",
  })
  .min(1, "The label is required.")
  .max(50, "The label must be at most 50 characters long.");

export const weightSchema = asNullableField(
  z.coerce
    .number({
      invalid_type_error: "The weight is not valid.",
    })
    .max(10000, "The weight can't be greater than 10,000.")
);

export const setTypeSchema = asNullableField(
  z.nativeEnum(SetType, { invalid_type_error: "The set type is not valid." })
);

export const repsSchema = asNullableField(
  z.coerce
    .number({
      invalid_type_error: "The reps are not valid.",
    })
    .max(10000, "The reps can't be greater than 10,000.")
);

export const rirSchema = asNullableField(
  z.coerce
    .number({
      invalid_type_error: "The RIR is not valid.",
    })
    .min(0, `The RIR can't be less than 0.`)
    .max(100, `The RIR can't be higher than 100.`)
);

export const idSchema = z
  .string({
    invalid_type_error: "The id is not valid.",
  })
  // It's 25 because cuid's and our generated id's are 25 characters long.
  .length(25, "The id is not valid");

export const exerciseNameSchema = z
  .string({
    invalid_type_error: "The name is not valid.",
    required_error: "The name is required.",
  })
  .min(1, "The name is required.")
  .max(100, "The name must be at most 100 characters long.");

export const muscleGroupNameSchema = z
  .string({
    invalid_type_error: "The muscle group is not valid.",
    required_error: "The muscle group is required.",
  })
  .min(1, "The muscle group is required.")
  .max(30, "The muscle group must be at most 30 characters long.");

export const routineNameSchema = z
  .string({
    invalid_type_error: "The name is not valid.",
    required_error: "The name is required.",
  })
  .min(1, "The name is required.")
  .max(70, "The name must be at most 70 characters long.");

export const notesSchema = z
  .string({
    invalid_type_error: "The notes are not valid.",
  })
  .optional();

export const emailSchema = z
  .string({
    invalid_type_error: "Email is not valid.",
    required_error: "Email is required.",
  })
  .min(1, "Email is required.")
  .max(254, "Email must be at most 254 characters long.")
  .email("Email is not valid.");

export const passwordSchema = z
  .string({
    invalid_type_error: "Password is not valid.",
    required_error: "Password is required.",
  })
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be at most 128 characters long.");

export function validateMinutesAndSeconds(
  timeStr?: string | null,
  optional: boolean = false
) {
  if (optional && !timeStr) {
    return true;
  }

  if (!timeStr) {
    return false;
  }

  // Format: 3:00
  const [minutes, seconds] = timeStr.split(":").map(Number);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return false;
  }

  return true;
}
