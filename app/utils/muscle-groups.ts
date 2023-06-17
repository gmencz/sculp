export function getUniqueMuscleGroups(
  exercises: {
    exercise: {
      muscleGroups: { name: string }[];
    } | null;
  }[]
) {
  return Array.from(
    new Set(
      exercises.flatMap(({ exercise }) =>
        exercise?.muscleGroups.map((muscleGroup) => muscleGroup.name)
      )
    )
  ) as string[];
}
