import {
  adductors,
  back,
  biceps,
  calves,
  chest,
  glutes,
  hamstrings,
  quads,
  shoulders,
  triceps,
} from "../exercises";
import type { PresetMesocycleTemplate } from ".";
import { defaultSets } from ".";

export const pushPullLegs3on1off: PresetMesocycleTemplate = {
  name: "Push Pull Legs (3 on 1 off)",
  microcycles: 8,
  restDays: [4, 8],
  trainingDays: [
    {
      label: "Push A",
      number: 1,
      exercises: [
        {
          name: chest["Chest Press Machine"],
          sets: [...defaultSets],
        },
        {
          name: chest["Incline Cable Fly"],
          sets: [...defaultSets],
        },
        {
          name: shoulders["Shoulder Press Machine"],
          sets: [...defaultSets],
        },
        {
          name: shoulders["SA Cable Lateral Raise"],
          sets: [...defaultSets],
        },
        {
          name: triceps["Cable Triceps Pushdown"],
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Pull A",
      number: 2,
      exercises: [
        {
          name: back["Lat Pulldown"],
          sets: [...defaultSets],
        },
        {
          name: back["Seated Cable Row Lats Bias"],
          sets: [...defaultSets],
        },
        {
          name: back["T-Bar Chest Supported Row Upper Back Bias"],
          sets: [...defaultSets],
        },
        {
          name: biceps["Preacher Curl Machine"],
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Legs A",
      number: 3,
      exercises: [
        {
          name: quads["Hack Squat"],
          sets: [...defaultSets],
        },
        {
          name: quads["Leg Extension"],
          notes: "Superset with Sissy Squat",
          sets: [...defaultSets],
        },
        {
          name: quads["Sissy Squat"],
          sets: [...defaultSets],
        },
        {
          name: hamstrings["Lying Leg Curl"],
          sets: [...defaultSets],
        },
        {
          name: glutes["Hip Thrust"],
          sets: [...defaultSets],
        },
        {
          name: hamstrings["Back Extension"],
          sets: [...defaultSets],
        },
        {
          name: calves["Standing Calf Raise Machine"],
          sets: [...defaultSets, defaultSets[0]],
        },
      ],
    },
    {
      label: "Push B",
      number: 5,
      exercises: [
        {
          name: shoulders["Smith Machine Shoulder Press"],
          sets: [...defaultSets],
        },
        {
          name: shoulders["Lateral Raise Machine"],
          sets: [...defaultSets],
        },
        {
          name: chest["Incline Chest Press Machine"],
          sets: [...defaultSets],
        },
        {
          name: chest["Chest Fly Machine"],
          sets: [...defaultSets],
        },
        {
          name: triceps["Cable Overhead Extension"],
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Pull B",
      number: 6,
      exercises: [
        {
          name: back["Chest Supported Machine Row Upper Back Bias"],
          sets: [...defaultSets],
        },
        {
          name: back["SA Bench Supported High Row Lats Bias"],
          sets: [...defaultSets],
        },
        {
          name: shoulders["Reverse Fly Machine"],
          sets: [...defaultSets],
        },
        {
          name: back["Chest Supported Machine Row Lats Bias"],
          sets: [...defaultSets],
        },
        {
          name: biceps["Incline DB Curl"],
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Legs B",
      number: 7,
      exercises: [
        {
          name: hamstrings["DB SLDL"],
          sets: [...defaultSets],
        },
        {
          name: adductors["Adductors Machine"],
          sets: [...defaultSets],
        },
        {
          name: quads["Leg Press"],
          sets: [...defaultSets],
        },
        {
          name: hamstrings["Seated Leg Curl"],
          sets: [...defaultSets],
        },
        {
          name: glutes["Bulgarian Split Squat Glutes Bias"],
          sets: [...defaultSets],
        },
        {
          name: calves["Seated Calf Raise Machine"],
          sets: [...defaultSets, defaultSets[0]],
        },
      ],
    },
  ],
};

export const pushPullLegs6on1off: PresetMesocycleTemplate = {
  ...pushPullLegs3on1off,
  name: "Push Pull Legs (6 on 1 off)",
  restDays: [7],
  trainingDays: [
    {
      ...pushPullLegs3on1off.trainingDays[0],
      number: 1,
    },
    {
      ...pushPullLegs3on1off.trainingDays[0],
      number: 1,
    },
    {
      ...pushPullLegs3on1off.trainingDays[1],
      number: 2,
    },
    {
      ...pushPullLegs3on1off.trainingDays[2],
      number: 3,
    },
    {
      ...pushPullLegs3on1off.trainingDays[3],
      number: 4,
    },
    {
      ...pushPullLegs3on1off.trainingDays[4],
      number: 5,
    },
    {
      ...pushPullLegs3on1off.trainingDays[5],
      number: 6,
    },
  ],
};
