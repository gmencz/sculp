/**
 * Gets the lower and upper bounds of the rep range.
 * @param repRange The rep range (e.g., 5-8, 10-15).
 * @returns tuple with the lower and upper bounds.
 */
export function getRepRangeBounds(repRange: string) {
  // The rep range will have the format:
  // "x-y" or for example "5-8" so we need to extract the bounds.
  const repRangeBounds = repRange.split("-");
  const repRangeLowerBound = Number(repRangeBounds[0]);
  const repRangeUpperBound = Number(repRangeBounds[1]);
  return [repRangeLowerBound, repRangeUpperBound];
}

/**
 * Validates a rep range.
 * @param repRange The rep range (e.g., 5-8, 10-15).
 * @param optional Whether the rep range is optional or not.
 * @returns Whether the rep range is valid or not.
 */
export function validateRepRange(repRange: string, optional: boolean = false) {
  if (optional && !repRange) {
    return true;
  }

  // Format: 5-8 or 5-10 or even 90-100.
  if (repRange.length > 5 || repRange[1] !== "-") {
    return false;
  }

  const [lowerBoundStr, upperBoundStr] = repRange.split("-");
  const lowerBound = Number(lowerBoundStr);
  const upperBound = Number(upperBoundStr);
  if (Number.isNaN(lowerBound) || Number.isNaN(upperBound)) {
    return false;
  }

  if (lowerBound >= upperBound) {
    return false;
  }

  return true;
}
