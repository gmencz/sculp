export enum MuscleGroup {
  ABS = "Abs",
  CHEST = "Chest",
  TRICEPS = "Triceps",
  SHOULDERS = "Shoulders",
  UPPER_BACK = "Upper Back",
  LATS = "Lats",
  BICEPS = "Biceps",
  QUADS = "Quads",
  GLUTES = "Glutes",
  HAMSTRINGS = "Hamstrings",
  ADDUCTORS = "Adductors",
  CALVES = "Calves",
  ERECTORS = "Erectors",
  FOREARMS = "Forearms",
  OTHER = "Other",
}

export const exercises = {
  "Flat Bench Press (Barbell)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },

  "Incline Bench Press (Barbell)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Flat Bench Press (Dumbbell)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Incline Bench Press (Dumbbell)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Flat Chest Press (Machine)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Incline Chest Press (Machine)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Flat Bench Press (Smith Machine)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Incline Bench Press (Smith Machine)": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Push-ups": {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  Dips: {
    primary: [MuscleGroup.CHEST],
    other: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  },
  "Chest Fly (Machine)": {
    primary: [MuscleGroup.CHEST],
    other: [],
  },
  "Chest Fly (Cable)": {
    primary: [MuscleGroup.CHEST],
    other: [],
  },
  "Shoulder Press (Barbell)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [MuscleGroup.TRICEPS, MuscleGroup.CHEST],
  },
  "Shoulder Press (Dumbbell)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [MuscleGroup.TRICEPS, MuscleGroup.CHEST],
  },
  "Shoulder Press (Machine)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [MuscleGroup.TRICEPS, MuscleGroup.CHEST],
  },
  "Shoulder Press (Smith Machine)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [MuscleGroup.TRICEPS, MuscleGroup.CHEST],
  },
  "Lateral Raise (Dumbbell)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [],
  },
  "Lateral Raise (Machine)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [],
  },
  "Lateral Raise (Cable)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [],
  },
  "Reverse Fly (Dumbbell)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [],
  },
  "Reverse Fly (Machine)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [],
  },
  "Reverse Fly (Cable)": {
    primary: [MuscleGroup.SHOULDERS],
    other: [],
  },
  "Triceps Pushdown (Machine)": {
    primary: [MuscleGroup.TRICEPS],
    other: [],
  },
  "Triceps Pushdown (Cable)": {
    primary: [MuscleGroup.TRICEPS],
    other: [],
  },
  "Triceps Overhead Extension (Dumbbell)": {
    primary: [MuscleGroup.TRICEPS],
    other: [],
  },
  "Triceps Overhead Extension (Machine)": {
    primary: [MuscleGroup.TRICEPS],
    other: [],
  },
  "Triceps Overhead Extension (Cable)": {
    primary: [MuscleGroup.TRICEPS],
    other: [],
  },
  "Skullcrushers (Barbell)": {
    primary: [MuscleGroup.TRICEPS],
    other: [],
  },
  "Lat Pulldown (Machine)": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS],
  },
  "Lat Pulldown (Cable)": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS],
  },
  "Pull-ups": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS],
  },
  "T-Bar Row (Machine)": {
    primary: [MuscleGroup.UPPER_BACK],
    other: [MuscleGroup.BICEPS, MuscleGroup.LATS],
  },
  "Seated Row (Machine)": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS, MuscleGroup.UPPER_BACK],
  },
  "Seated Row (Cable)": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS, MuscleGroup.UPPER_BACK],
  },
  "Bent Over Row (Barbell)": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS, MuscleGroup.UPPER_BACK, MuscleGroup.ERECTORS],
  },
  "Bent Over Row (Dumbbell)": {
    primary: [MuscleGroup.LATS],
    other: [MuscleGroup.BICEPS, MuscleGroup.UPPER_BACK, MuscleGroup.ERECTORS],
  },
  "Back Extension": {
    primary: [MuscleGroup.ERECTORS],
    other: [],
  },
  "Preacher Curl (Machine)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Preacher Curl (Barbell)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Preacher Curl (Dumbbell)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Bicep Curl (Barbell)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Bicep Curl (Dumbbell)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Bicep Curl (Cable)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Incline Bicep Curl (Dumbbell)": {
    primary: [MuscleGroup.BICEPS],
    other: [MuscleGroup.FOREARMS],
  },
  "Back Squat (Barbell)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS, MuscleGroup.GLUTES],
  },
  "Back Squat (Smith Machine)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS],
  },
  "Hack Squat (Machine)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS],
  },
  "Pendulum Squat (Machine)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS],
  },
  "Leg Extension (Machine)": {
    primary: [MuscleGroup.QUADS],
    other: [],
  },
  "Sissy Squat": {
    primary: [MuscleGroup.QUADS],
    other: [],
  },
  "Leg Press (Machine)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS, MuscleGroup.GLUTES],
  },
  "Bulgarian Split Squat (Dumbbell)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS, MuscleGroup.GLUTES],
  },
  "Bulgarian Split Squat (Smith Machine)": {
    primary: [MuscleGroup.QUADS],
    other: [MuscleGroup.ADDUCTORS, MuscleGroup.GLUTES],
  },
  "Seated Leg Curl (Machine)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [],
  },
  "Seated Leg Curl (Cable)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [],
  },
  "Lying Leg Curl (Machine)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [],
  },
  "Stiff-Legged Deadlift (Machine)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.ERECTORS, MuscleGroup.GLUTES],
  },
  "Stiff-Legged Deadlift (Barbell)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.ERECTORS, MuscleGroup.GLUTES],
  },
  "Stiff-Legged Deadlift (Dumbbell)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.ERECTORS, MuscleGroup.GLUTES],
  },
  "Romanian Deadlift (Machine)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.ERECTORS, MuscleGroup.GLUTES],
  },
  "Romanian Deadlift (Barbell)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.ERECTORS, MuscleGroup.GLUTES],
  },
  "Romanian Deadlift (Dumbbell)": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.ERECTORS, MuscleGroup.GLUTES],
  },
  "Nordic Hamstring Curl": {
    primary: [MuscleGroup.HAMSTRINGS],
    other: [MuscleGroup.GLUTES],
  },
  "Hip Thrust (Machine)": {
    primary: [MuscleGroup.GLUTES],
    other: [],
  },
  "Hip Thrust (Smith Machine)": {
    primary: [MuscleGroup.GLUTES],
    other: [],
  },
  "Hip Thrust (Barbell)": {
    primary: [MuscleGroup.GLUTES],
    other: [],
  },
  "Glute Kickback (Machine)": {
    primary: [MuscleGroup.GLUTES],
    other: [],
  },
  "Glute Kickback (Cable)": {
    primary: [MuscleGroup.GLUTES],
    other: [],
  },
  "Abductors (Machine)": {
    primary: [MuscleGroup.GLUTES],
    other: [],
  },
  "Adductors (Machine)": {
    primary: [MuscleGroup.ADDUCTORS],
    other: [],
  },
  "Standing Calf Raise (Machine)": {
    primary: [MuscleGroup.CALVES],
    other: [],
  },
  "Seated Calf Raise (Machine)": {
    primary: [MuscleGroup.CALVES],
    other: [],
  },
};
