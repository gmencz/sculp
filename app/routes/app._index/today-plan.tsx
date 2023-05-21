import { Heading } from "~/components/heading";
import type { CurrentMesocycleStartedData } from "./route";
import type { RefObject } from "react";
import { useState } from "react";
import { useMemo, useRef } from "react";
import { Form, Link, useActionData } from "@remix-run/react";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { Paragraph } from "~/components/paragraph";
import type { FieldConfig } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useFieldset } from "@conform-to/react";
import { useFieldList, useForm } from "@conform-to/react";
import type { ExerciseSchema } from "./schema";
import { exerciseSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

type TodayPlanProps = {
  data: CurrentMesocycleStartedData;
};

export function TodayPlan({ data }: TodayPlanProps) {
  const { trainingDay, dayNumber, microcycleNumber } = data.today;

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <h2 className="mb-1 font-medium text-zinc-700">
        {data.mesocycleName} - M{microcycleNumber} D{dayNumber}
      </h2>

      {trainingDay ? (
        <TrainingDay
          microcycleNumber={microcycleNumber}
          dayNumber={dayNumber}
          trainingDay={trainingDay}
        />
      ) : (
        <RestDay microcycleNumber={microcycleNumber} dayNumber={dayNumber} />
      )}
    </div>
  );
}

type TrainingDayProps = {
  microcycleNumber: number;
  dayNumber: number;
  trainingDay: NonNullable<CurrentMesocycleStartedData["today"]["trainingDay"]>;
};

function TrainingDay({
  trainingDay,
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

  return (
    <>
      <Heading>{trainingDay.label}</Heading>

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

            <ul className="mt-2 flex flex-wrap gap-2">
              {exercise.exercise.muscleGroups.map((muscleGroup, index) => (
                <li key={muscleGroup.name}>
                  <MuscleGroupBadge index={index}>
                    {muscleGroup.name}
                  </MuscleGroupBadge>
                </li>
              ))}
            </ul>

            <ExerciseForm exercise={exercise} />
          </li>
        ))}
      </ol>
    </>
  );
}

type ExerciseFormProps = {
  exercise: NonNullable<
    CurrentMesocycleStartedData["today"]["trainingDay"]
  >["exercises"][number];
};

function ExerciseForm({ exercise }: ExerciseFormProps) {
  const lastSubmission = useActionData();
  const [form, { sets }] = useForm<ExerciseSchema>({
    id: `exercise-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
        rir: set.rir.toString(),
        weight: set.weight.toString(),
        completed: set.completed ? "yes" : "",
      })),
    },
    onValidate({ formData }) {
      return parse(formData, { schema: exerciseSchema });
    },
  });

  const setsList = useFieldList(form.ref, sets);

  return (
    <Form method="post" className="mt-5" {...form.props}>
      <table>
        <thead>
          <tr>
            <td className="pb-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900">
              Weight
            </td>
            <td className="pb-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900">
              Rep range
            </td>
            <td className="pb-2 pr-3 text-center text-xs font-medium uppercase text-zinc-900">
              RIR
            </td>
            <td className="pb-2 text-center text-xs font-medium uppercase text-zinc-900">
              Reps
            </td>
          </tr>
        </thead>
        <tbody>
          {setsList.map((set, index) => (
            <SetRow
              formRef={form.ref}
              key={set.key}
              index={index}
              config={set}
            />
          ))}
        </tbody>
      </table>
    </Form>
  );
}

type SetRowProps = {
  index: number;
  formRef: RefObject<HTMLFormElement>;
  config: FieldConfig<ExerciseSchema["sets"][number]>;
};

function SetRow({ config, index, formRef }: SetRowProps) {
  const { id, completed, repRange, repsCompleted, rir, weight } = useFieldset(
    formRef,
    config
  );

  const [values, setValues] = useState({
    repRange: repRange.defaultValue ?? "",
    repsCompleted: repsCompleted.defaultValue ?? "",
    rir: rir.defaultValue ?? "",
    weight: weight.defaultValue ?? "",
  });

  const canCompleteSet = Object.values(values).every(Boolean);

  return (
    <>
      <tr>
        <td className="pr-3">
          <input {...conform.input(id, { hidden: true })} />

          <Input
            hideErrorMessage
            hideLabel
            config={weight}
            label="Weight"
            type="number"
            className="text-center"
            onChange={(e) =>
              setValues((currentValues) => ({
                ...currentValues,
                weight: e.target.value,
              }))
            }
          />
        </td>

        <td className="pr-3">
          <Input
            hideErrorMessage
            hideLabel
            config={repRange}
            label="Rep range"
            className="text-center"
            onChange={(e) =>
              setValues((currentValues) => ({
                ...currentValues,
                repRange: e.target.value,
              }))
            }
          />
        </td>

        <td className="pr-3">
          <Input
            hideErrorMessage
            hideLabel
            config={rir}
            label="RIR"
            type="number"
            className="text-center"
            onChange={(e) =>
              setValues((currentValues) => ({
                ...currentValues,
                rir: e.target.value,
              }))
            }
          />
        </td>

        <td className="pr-3">
          <Input
            hideErrorMessage
            hideLabel
            config={repsCompleted}
            label="Reps"
            type="number"
            className="text-center"
            onChange={(e) =>
              setValues((currentValues) => ({
                ...currentValues,
                repsCompleted: e.target.value,
              }))
            }
          />
        </td>

        <td>
          <button
            type="submit"
            disabled={!canCompleteSet}
            className={clsx(
              "mt-1 h-full rounded  px-3 py-1.5",
              completed.defaultValue
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-zinc-200"
            )}
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </td>
      </tr>
    </>
  );
}

type RestDayProps = {
  microcycleNumber: number;
  dayNumber: number;
};

function RestDay({ dayNumber, microcycleNumber }: RestDayProps) {
  return (
    <>
      <Heading>Rest</Heading>

      <p className="mt-2 text-zinc-500">
        There's nothing for you to do today other than rest and recover for your
        next training session!
      </p>
    </>
  );
}
