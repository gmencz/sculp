import type { PresetMesocycleTemplate } from ".";

// // 2 sets by default
const defaultSets = [
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
];

export const pushPullLegsUpperLower: PresetMesocycleTemplate = {
  name: "Push Pull Legs Upper Lower",
  microcycles: 8,
  restDays: [4, 7],
  trainingDays: [
    {
      label: "Push",
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
      label: "Pull",
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
      label: "Legs",
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
      label: "Upper",
      number: 5,
      exercises: [
        {
          name: "Incline Chest Press (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Seated Row (Machine)",
          sets: [...defaultSets],
          notes: "Wide grip",
        },
        {
          name: "Lateral Raise (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Pull-ups",
          sets: [...defaultSets],
        },
        {
          name: "Bicep Curl (Dumbbell)",
          sets: [...defaultSets],
        },
        {
          name: "Triceps Overhead Extension (Machine)",
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Lower",
      number: 6,
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
