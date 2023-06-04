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
