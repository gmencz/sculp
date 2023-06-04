type GetSetPerformanceSet = {
  repsCompleted: number | null;
  weight: number | null;
  rir: number;
  completed: boolean;
};

export function getSetPerformance(
  previousRunSet: GetSetPerformanceSet | undefined,
  thisRunSet: GetSetPerformanceSet
) {
  if (
    !previousRunSet ||
    !previousRunSet.repsCompleted ||
    !previousRunSet.weight ||
    !thisRunSet.repsCompleted ||
    !thisRunSet.completed ||
    !thisRunSet.weight
  ) {
    return "unknown";
  }

  // If weight is the same and completed less reps, performance declined.
  if (
    thisRunSet.weight === previousRunSet.weight &&
    thisRunSet.repsCompleted < previousRunSet.repsCompleted
  ) {
    return "declined";
  }

  // If weight is the same, intensity is higher and completed same reps, performance declined.
  if (
    thisRunSet.weight === previousRunSet.weight &&
    thisRunSet.rir < previousRunSet.rir &&
    thisRunSet.repsCompleted === previousRunSet.repsCompleted
  ) {
    return "declined";
  }

  // If weight is the same, intensity is the same or lower and completed more reps, performance increased.
  if (
    thisRunSet.weight === previousRunSet.weight &&
    thisRunSet.rir >= previousRunSet.rir &&
    thisRunSet.repsCompleted > previousRunSet.repsCompleted
  ) {
    return "increased";
  }

  // If weight is higher, intensity is the same or lower and completed the same or more reps, performance increased.
  if (
    thisRunSet.weight > previousRunSet.weight &&
    thisRunSet.rir >= previousRunSet.rir &&
    thisRunSet.repsCompleted >= previousRunSet.repsCompleted
  ) {
    return "increased";
  }

  const setTotalVolume = thisRunSet.weight * thisRunSet.repsCompleted;
  const previousRunSetTotalVolume =
    previousRunSet.weight * previousRunSet.repsCompleted;

  if (setTotalVolume > previousRunSetTotalVolume) {
    return "increased";
  } else if (setTotalVolume < previousRunSetTotalVolume) {
    return "declined";
  }

  return "maintained";
}
