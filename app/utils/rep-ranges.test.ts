import { getRepRangeBounds, validateRepRange } from "./rep-ranges";

test("getRepRangeBounds returns tuple with the lower and upper bounds", () => {
  expect(getRepRangeBounds("5-8")).toStrictEqual([5, 8]);
  expect(getRepRangeBounds("10-15")).toStrictEqual([10, 15]);
  expect(getRepRangeBounds("50-100")).toStrictEqual([50, 100]);
});

test("validateRepRange returns false for invalid rep ranges", () => {
  expect(validateRepRange("5 8")).toBe(false);
  expect(validateRepRange("5_8")).toBe(false);
  expect(validateRepRange("5.8")).toBe(false);
  expect(validateRepRange("10")).toBe(false);
  expect(validateRepRange("5")).toBe(false);
});

test("validateRepRange returns true for valid rep ranges", () => {
  expect(validateRepRange("5-8")).toBe(true);
  expect(validateRepRange("10-15")).toBe(true);
  expect(validateRepRange("50-100")).toBe(true);
});

test("validateRepRange returns true for empty rep ranges if optional is true", () => {
  expect(validateRepRange("", true)).toBe(true);
});
