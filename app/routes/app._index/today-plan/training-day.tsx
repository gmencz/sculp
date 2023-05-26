import { useMemo } from "react";
import type { CurrentMesocycleStartedData } from "../route";
import { useNavigation } from "@remix-run/react";
import { actionIntents } from "../schema";
import { Heading } from "~/components/heading";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayExercise } from "./training-day-exercise";

type TrainingDayProps = {
  trainingDay: NonNullable<CurrentMesocycleStartedData["today"]["trainingDay"]>;
  mesocycleName: string;
  microcycleNumber: number;
  dayNumber: number;
};

export function TrainingDay({
  trainingDay,
  mesocycleName,
  microcycleNumber,
  dayNumber,
}: TrainingDayProps) {
  const muscleGroups = useMemo(() => {
    const set = new Set<string>();

    trainingDay.exercises.forEach((exercise) => {
      exercise.exercise.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  }, [trainingDay]);

  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === actionIntents[1];

  return (
    <>
      <div className="bg-zinc-900 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-1 font-medium text-zinc-200">
            {mesocycleName} - M{microcycleNumber} D{dayNumber}
          </h2>

          <Heading white>{trainingDay.label}</Heading>

          <ul className="mt-3 flex flex-wrap gap-2">
            {muscleGroups.map((muscleGroup, index) => (
              <li key={muscleGroup}>
                <MuscleGroupBadge white index={index}>
                  {muscleGroup}
                </MuscleGroupBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-zinc-50 pb-6 sm:mt-6 sm:pb-10">
        <ol className="flex flex-col gap-6">
          {trainingDay.exercises.map((exercise) => (
            <li key={exercise.id}>
              <TrainingDayExercise exercise={exercise} />
            </li>
          ))}
        </ol>

        <div className="mt-6 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-2xl">
            <SubmitButton isSubmitting={isSubmitting} text="Finish session" />
          </div>
        </div>
      </div>
    </>
  );
}
