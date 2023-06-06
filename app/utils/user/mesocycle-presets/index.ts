import { broSplit } from "./bro";
import { pushPullLegs6on1off, pushPullLegs3on1off } from "./push-pull-legs";
import { pushPullLegsUpperLower } from "./push-pull-legs-upper-lower";
import { upperLower } from "./upper-lower";

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

export const mesocyclePresets = [
  pushPullLegs3on1off,
  pushPullLegs6on1off,
  pushPullLegsUpperLower,
  upperLower,
  broSplit,
];
