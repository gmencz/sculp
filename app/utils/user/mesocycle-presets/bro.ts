import type { PresetMesocycleTemplate } from ".";

// // 2 sets by default
const defaultSets = [
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
  { rir: 0, repRangeLowerBound: 5, repRangeUpperBound: 8 },
];

export const broSplit: PresetMesocycleTemplate = {
  name: "Bro Split",
  microcycles: 8,
  restDays: [3, 6, 7],
  trainingDays: [
    {
      label: "Chest",
      number: 1,
      exercises: [
        {
          name: "Flat Chest Press (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Incline Chest Press (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Chest Fly (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
      ],
    },
    {
      label: "Back",
      number: 2,
      exercises: [
        {
          name: "Lat Pulldown (Cable)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Seated Row (Cable)",
          sets: [...defaultSets, defaultSets[0]],
          notes: "Narrow grip",
        },
        {
          name: "T-Bar Row (Machine)",
          sets: [...defaultSets, defaultSets[0]],
          notes: "Wide grip",
        },
      ],
    },
    {
      label: "Legs",
      number: 4,
      exercises: [
        {
          name: "Stiff-Legged Deadlift (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Hack Squat (Machine)",
          sets: [...defaultSets, ...defaultSets],
        },
        {
          name: "Bulgarian Split Squat (Smith Machine)",
          sets: [...defaultSets, defaultSets[0]],
          notes: "Wide stance",
        },
        {
          name: "Hip Thrust (Machine)",
          sets: [...defaultSets, defaultSets[0]],
          notes: "Wide stance",
        },
        {
          name: "Leg Extension (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Seated Leg Curl (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Adductors (Machine)",
          sets: [...defaultSets],
        },
        {
          name: "Standing Calf Raise (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Seated Calf Raise (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
      ],
    },
    {
      label: "Shoulders and Arms",
      number: 5,
      exercises: [
        {
          name: "Shoulder Press (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Lateral Raise (Cable)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Lateral Raise (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Reverse Fly (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Bicep Curl (Dumbbell)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Triceps Overhead Extension (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Preacher Curl (Machine)",
          sets: [...defaultSets, defaultSets[0]],
        },
        {
          name: "Triceps Pushdown (Cable)",
          sets: [...defaultSets, defaultSets[0]],
        },
      ],
    },
  ],
};
