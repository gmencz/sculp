import { z } from "zod";

const emptyStringToNull = z.literal("").transform(() => null);

export function asNullableField<T extends z.ZodTypeAny>(schema: T) {
  return emptyStringToNull.optional().or(schema);
}
