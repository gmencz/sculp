export function getUniqueMuscleGroups(trainingDay: {
  exercises: {
    exercise: {
      muscleGroups: { name: string }[];
    } | null;
  }[];
}) {
  return Array.from(
    new Set(
      trainingDay.exercises.flatMap(({ exercise }) =>
        exercise?.muscleGroups.map((muscleGroup) => muscleGroup.name)
      )
    )
  ) as string[];
}
