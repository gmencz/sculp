// Going all the way to failure leads to superior hypertrophy.
export const rir = 0;

// This is the optimal rep range for hypertrophy to limit fatigue.
export const repRangeLowerBound = 5;
export const repRangeUpperBound = 8;

export type PresetMesocycleTemplate = {
  name: string;
  microcycles: number;
  restDays: number[];
  trainingDays: {
    label: string;
    number: number;
    exercises: {
      name: string;
      notes?: string;
      sets: {
        rir: number;
        repRangeLowerBound: number;
        repRangeUpperBound: number;
      }[];
    }[];
  }[];
};

export { pushPullLegs3on1off, pushPullLegs6on1off } from "./push-pull-legs";
