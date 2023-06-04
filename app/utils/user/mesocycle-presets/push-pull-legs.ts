import type { PresetMesocycleTemplate } from "./config";

// // 2 sets by default
const defaultSets = [
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
];

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
          name: "Flat Chest Press (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Chest Fly (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Shoulder Press (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Lateral Raise (Cable)",
          sets: [...defaultSets],
        },
        {
          name: "Triceps Pushdown (Cable)",
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Pull A",
      number: 2,
      exercises: [
        {
          name: "Lat Pulldown (Cable)",
          sets: [...defaultSets],
        },
        {
          name: "Seated Row (Cable)",
          sets: [...defaultSets],
          notes: "Narrow grip",
        },
        {
          name: "T-Bar Row (Machine)",
          sets: [...defaultSets],
          notes: "Wide grip",
        },
        {
          name: "Preacher Curl (Machine)",
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Legs A",
      number: 3,
      exercises: [
        {
          name: "Hack Squat (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Leg Extension (Machine)",
          notes: "Superset with Sissy Squat",
          sets: [...defaultSets],
        },
        {
          name: "Sissy Squat",
          sets: [...defaultSets],
        },
        {
          name: "Lying Leg Curl (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Hip Thrust (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Back Extension",
          sets: [...defaultSets],
        },
        {
          name: "Standing Calf Raise (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
      ],
    },
    {
      label: "Push B",
      number: 5,
      exercises: [
        {
          name: "Shoulder Press (Smith Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Lateral Raise (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Incline Chest Press (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Chest Fly (Cable)",
          sets: [...defaultSets],
        },
        {
          name: "Triceps Overhead Extension (Machine)",
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Pull B",
      number: 6,
      exercises: [
        {
          name: "Bent Over Row (Barbell)",
          sets: [...defaultSets],
          notes: "Narrow grip",
        },
        {
          name: "Seated Row (Machine)",
          sets: [...defaultSets],
          notes: "Wide grip",
        },
        {
          name: "SA High Row (Cable)",
          sets: [...defaultSets],
        },
        {
          name: "Reverse Fly (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Bicep Curl (Dumbbell)",
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Legs B",
      number: 7,
      exercises: [
        {
          name: "Stiff-Legged Deadlift (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Adductors (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Leg Press (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Seated Leg Curl (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Bulgarian Split Squat (Smith Machine)",
          sets: [...defaultSets],
          notes: "Wide stance",
        },
        {
          name: "Seated Calf Raise (Machine)",
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
