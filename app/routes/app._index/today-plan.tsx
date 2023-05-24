import { Heading } from "~/components/heading";
import type { CurrentMesocycleStartedData } from "./route";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { SubmitButton } from "~/components/submit-button";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { CheckIcon } from "@heroicons/react/20/solid";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Input } from "~/components/input";
import type { UpdateExerciseSchema, UpdateSetSchema } from "./schema";
import { updateExerciseSchema } from "./schema";
import { actionIntents } from "./schema";
import { updateSetSchema } from "./schema";
import clsx from "clsx";
import { Textarea } from "~/components/textarea";
import { useDebounce } from "~/utils";

type TodayPlanProps = {
  data: CurrentMesocycleStartedData;
};

export function TodayPlan({ data }: TodayPlanProps) {
  const { trainingDay, dayNumber, microcycleNumber } = data.today;

  if (trainingDay) {
    return (
      <TrainingDay
        mesocycleName={data.mesocycleName}
        dayNumber={dayNumber}
        microcycleNumber={microcycleNumber}
        trainingDay={trainingDay}
      />
    );
  }

  return (
    <RestDay
      dayNumber={dayNumber}
      mesocycleName={data.mesocycleName}
      microcycleNumber={microcycleNumber}
    />
  );
}

type RestDayProps = {
  mesocycleName: string;
  microcycleNumber: number;
  dayNumber: number;
};

function RestDay({ mesocycleName, microcycleNumber, dayNumber }: RestDayProps) {
  return (
    <>
      <div className="bg-zinc-900 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-1 font-medium text-zinc-200">
            {mesocycleName} - M{microcycleNumber} D{dayNumber}
          </h2>

          <Heading white>Rest</Heading>

          <p className="mt-2 text-zinc-200">
            There's nothing for you to do today other than rest and recover for
            your next training session!
          </p>
        </div>
      </div>
    </>
  );
}

type TrainingDayProps = {
  trainingDay: NonNullable<CurrentMesocycleStartedData["today"]["trainingDay"]>;
  mesocycleName: string;
  microcycleNumber: number;
  dayNumber: number;
};

function TrainingDay({
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
            <li
              className="mx-auto w-full max-w-2xl rounded border-b border-zinc-200 bg-white px-4 pb-6 pt-4 sm:px-6 sm:pb-10 lg:px-8"
              key={exercise.id}
            >
              <div className="flex items-center gap-8">
                <ul className="flex flex-wrap gap-2">
                  {exercise.exercise.muscleGroups.map((muscleGroup, index) => (
                    <li key={muscleGroup.name}>
                      <MuscleGroupBadge index={index}>
                        {muscleGroup.name}
                      </MuscleGroupBadge>
                    </li>
                  ))}
                </ul>

                <div className="ml-auto flex items-center gap-4">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 text-zinc-600 hover:text-zinc-700"
                  >
                    <EllipsisVerticalIcon className="h-6 w-6" />
                    <span className="sr-only">Notes</span>
                  </button>
                </div>
              </div>

              <h3 className="mt-3 text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
                {exercise.exercise.name}
              </h3>

              <Exercise exercise={exercise} />
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

type ExerciseProps = {
  exercise: NonNullable<
    CurrentMesocycleStartedData["today"]["trainingDay"]
  >["exercises"][number];
};

function Exercise({ exercise }: ExerciseProps) {
  const [submitEvent, setSubmitEvent] = useState<FormEvent<HTMLFormElement>>();
  const debouncedSubmitEvent = useDebounce(submitEvent, 3000);
  const submit = useSubmit();
  const lastSubmission = useActionData();
  const [form, { id, notes, actionIntent }] = useForm<UpdateExerciseSchema>({
    id: `exercise-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      notes: exercise.notes ?? "",
      actionIntent: actionIntents[2],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateExerciseSchema });
    },
  });

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    setSubmitEvent(event);
  };

  useEffect(() => {
    if (debouncedSubmitEvent) {
      submit(form.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [debouncedSubmitEvent, form.ref, submit]);

  return (
    <div className="mt-3">
      <Form
        preventScrollReset
        replace
        method="post"
        className="mb-4"
        onChange={handleChange}
        {...form.props}
      >
        <input {...conform.input(id, { hidden: true })} />
        <input {...conform.input(actionIntent, { hidden: true })} />

        <Textarea
          hideLabel
          hideErrorMessage
          config={notes}
          label="Notes"
          rows={2}
          placeholder="Notes"
        />
      </Form>

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
          {exercise.sets.map((set) => (
            <SetRow key={set.id} set={set} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type SetRowProps = {
  set: NonNullable<
    CurrentMesocycleStartedData["today"]["trainingDay"]
  >["exercises"][number]["sets"][number];
};

function SetRow({ set }: SetRowProps) {
  const lastSubmission = useActionData();
  const [
    form,
    {
      id,
      completed,
      repRange,
      repsCompleted,
      rir,
      wantsToComplete,
      weight,
      actionIntent,
    },
  ] = useForm<UpdateSetSchema>({
    id: `set-${set.id}`,
    lastSubmission,
    defaultValue: {
      id: set.id,
      completed: set.completed ? "yes" : undefined,
      repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
      repsCompleted: set.repsCompleted?.toString(),
      rir: set.rir.toString(),
      weight: set.weight.toString(),
      actionIntent: actionIntents[0],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateSetSchema });
    },
  });

  const [values, setValues] = useState({
    repRange: repRange.defaultValue,
    repsCompleted: repsCompleted.defaultValue,
    rir: rir.defaultValue,
    weight: weight.defaultValue,
    completed: completed.defaultValue,
  });

  const handleValueChange = (
    e: ChangeEvent<HTMLInputElement>,
    name: keyof typeof values
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [name]: e.target.value,
    }));
  };

  const navigation = useNavigation();

  // Optimistic UI:
  // If user is trying to complete/uncomplete a set, update it on the client as that so the user gets the feeling
  // that it works instantly.
  useEffect(() => {
    if (navigation.formData) {
      const actionIntent = navigation.formData.get("actionIntent");
      if (actionIntent === actionIntents[0]) {
        const updatedSetId = navigation.formData.get("id");
        if (updatedSetId === set.id) {
          const wantsToComplete = navigation.formData.get("wantsToComplete");
          if (typeof wantsToComplete === "string") {
            setValues((currentValues) => ({
              ...currentValues,
              completed: wantsToComplete ? "yes" : undefined,
            }));
          }
        }
      }
    }
  }, [navigation.formData, set]);

  // Make sure the state values are up to date with the form's values.
  useEffect(() => {
    if (
      repRange.defaultValue !== values.repRange ||
      repsCompleted.defaultValue !== values.repsCompleted ||
      rir.defaultValue !== values.rir ||
      weight.defaultValue !== values.weight ||
      (completed.defaultValue !== values.completed &&
        navigation.state === "idle")
    ) {
      setValues({
        repRange: repRange.defaultValue,
        repsCompleted: repsCompleted.defaultValue,
        rir: rir.defaultValue,
        weight: weight.defaultValue,
        completed: completed.defaultValue,
      });
    }
  }, [
    completed.defaultValue,
    navigation.state,
    repRange.defaultValue,
    repsCompleted.defaultValue,
    rir.defaultValue,
    values.completed,
    values.repRange,
    values.repsCompleted,
    values.rir,
    values.weight,
    weight.defaultValue,
  ]);

  const canCompleteSet = Boolean(
    values.repRange && values.repsCompleted && values.rir && values.weight
  );

  return (
    <>
      <tr>
        <td className="pr-3">
          <Form
            preventScrollReset
            replace
            method="post"
            className="hidden"
            {...form.props}
          />

          <input {...conform.input(id, { hidden: true })} />
          <input {...conform.input(completed, { hidden: true })} />
          <input {...conform.input(actionIntent, { hidden: true })} />

          <Input
            hideErrorMessage
            hideLabel
            config={weight}
            label="Weight"
            type="number"
            className="text-center"
            onChange={(e) => handleValueChange(e, "weight")}
            min={0}
            max={10000}
          />
        </td>

        <td className="pr-3">
          <Input
            hideErrorMessage
            hideLabel
            config={repRange}
            label="Rep range"
            className="text-center"
            onChange={(e) => handleValueChange(e, "repRange")}
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
            onChange={(e) => handleValueChange(e, "rir")}
            min={0}
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
            onChange={(e) => handleValueChange(e, "repsCompleted")}
            min={0}
          />
        </td>

        <td>
          <button
            form={form.id}
            type="submit"
            name={wantsToComplete.name}
            value={values.completed ? "" : "true"}
            disabled={values.completed ? false : !canCompleteSet}
            className={clsx(
              "mt-1 h-full rounded px-2 py-1.5 transition-all",
              values.completed
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 disabled:text-zinc-400 disabled:hover:bg-zinc-200"
            )}
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </td>
      </tr>
    </>
  );
}
