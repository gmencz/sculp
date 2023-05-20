import { Heading } from "~/components/heading";
import type { CurrentMesocycleStartedData } from "./route";
import { useMemo } from "react";
import { Link } from "@remix-run/react";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { Paragraph } from "~/components/paragraph";

type TodayPlanProps = {
  data: CurrentMesocycleStartedData;
};

export function TodayPlan({ data }: TodayPlanProps) {
  const { trainingDay, dayNumber, microcycleNumber } = data.today;

  const muscleGroups = useMemo(() => {
    if (!trainingDay) return [];

    const set = new Set<string>();

    trainingDay.exercises.forEach((exercise) => {
      exercise.exercise.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  }, [trainingDay]);

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <h2 className="mb-1 font-medium text-zinc-700">{data.mesocycleName}</h2>

      <Heading>
        M{microcycleNumber} D{dayNumber} -{" "}
        {trainingDay ? trainingDay.label : "Rest"}
      </Heading>

      {trainingDay ? (
        <>
          <ul className="mt-3 flex flex-wrap gap-2">
            {muscleGroups.map((muscleGroup, index) => (
              <li key={muscleGroup}>
                <MuscleGroupBadge index={index}>{muscleGroup}</MuscleGroupBadge>
              </li>
            ))}
          </ul>

          <ol className="mt-10 flex flex-col gap-10">
            {trainingDay.exercises.map((exercise) => (
              <li key={exercise.id}>
                <h3 className="text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
                  {exercise.exercise.name}
                </h3>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {exercise.exercise.muscleGroups.map((muscleGroup, index) => (
                    <li key={muscleGroup.name}>
                      <MuscleGroupBadge index={index}>
                        {muscleGroup.name}
                      </MuscleGroupBadge>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className="mt-2 text-zinc-500">
            There's nothing for you to do today other than rest and recover for
            your next training session!
          </p>
        </>
      )}
    </div>
  );
}
