import type { PresetMesocycleTemplate } from ".";

// // 2 sets by default
const defaultSets = [
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
];

export const upperLower: PresetMesocycleTemplate = {
  name: "Upper Lower",
  microcycles: 8,
  restDays: [3, 6, 7],
  trainingDays: [
    {
      label: "Upper A",
      number: 1,
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
      label: "Lower A",
      number: 2,
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
    {
      label: "Upper B",
      number: 4,
      exercises: [
        {
          name: "Flat Chest Press (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Seated Row (Cable)",
          sets: [...defaultSets],
          notes: "Narrow grip",
        },
        {
          name: "Lateral Raise (Cable)",
          sets: [...defaultSets],
        },
        {
          name: "T-Bar Row (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Preacher Curl (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Triceps Pushdown (Cable)",
          sets: [...defaultSets],
        },
      ],
    },
    {
      label: "Lower B",
      number: 5,
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
  ],
};
