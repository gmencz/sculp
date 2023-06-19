type GetSetPerformanceSet = {
  repsCompleted: number | null;
  weight: number | null;
  rir: number;
  completed: boolean;
};

export enum SetPerformance {
  INCREASED,
  DECLINED,
  MAINTAINED,
  UNKNOWN,
}

export function getSetPerformance(
  previousSet: GetSetPerformanceSet | undefined,
  thisSet: GetSetPerformanceSet | undefined
): SetPerformance {
  if (
    !previousSet ||
    !previousSet.repsCompleted ||
    !previousSet.weight ||
    !thisSet ||
    !thisSet.repsCompleted ||
    !thisSet.completed ||
    !thisSet.weight
  ) {
    return SetPerformance.UNKNOWN;
  }

  // If weight is the same and completed less reps, performance declined.
  if (
    thisSet.weight === previousSet.weight &&
    thisSet.repsCompleted < previousSet.repsCompleted
  ) {
    return SetPerformance.DECLINED;
  }

  // If weight is the same, intensity is higher and completed same reps, performance declined.
  if (
    thisSet.weight === previousSet.weight &&
    thisSet.rir < previousSet.rir &&
    thisSet.repsCompleted === previousSet.repsCompleted
  ) {
    return SetPerformance.DECLINED;
  }

  // If weight is the same, intensity is the same or lower and completed more reps, performance increased.
  if (
    thisSet.weight === previousSet.weight &&
    thisSet.rir >= previousSet.rir &&
    thisSet.repsCompleted > previousSet.repsCompleted
  ) {
    return SetPerformance.INCREASED;
  }

  // If weight is higher, intensity is the same or lower and completed the same or more reps, performance increased.
  if (thisSet.weight > previousSet.weight && thisSet.rir >= previousSet.rir) {
    return SetPerformance.INCREASED;
  }

  const setTotalVolume = thisSet.weight * thisSet.repsCompleted;
  const previousSetTotalVolume = previousSet.weight * previousSet.repsCompleted;

  if (setTotalVolume > previousSetTotalVolume) {
    return SetPerformance.INCREASED;
  } else if (setTotalVolume < previousSetTotalVolume) {
    return SetPerformance.DECLINED;
  }

  return SetPerformance.MAINTAINED;
}
