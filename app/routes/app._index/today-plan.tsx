import { Heading } from "~/components/heading";
import type { CurrentMesocycleStartedData } from "./route";
import type { ChangeEvent, FormEvent } from "react";
import { Fragment } from "react";
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
import { Popover, Transition } from "@headlessui/react";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

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
              className=" rounded border-b border-zinc-200 bg-white px-4 pb-6 pt-4 sm:px-6 sm:pb-10 lg:px-8"
              key={exercise.id}
            >
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

  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));

  const menuOptions = [
    {
      name: "Add notes",
      onClick: () => {
        setShowNotes(true);
      },
    },
  ];

  // const askBioFeedback = exercise.sets.every((set) => set.completed);

  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === actionIntents[2];

  return (
    <div className="mx-auto w-full max-w-2xl">
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
          <Popover className="relative flex items-center">
            <Popover.Button
              type="button"
              className="-m-1.5 rounded p-1.5 text-zinc-600 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-opacity-75"
            >
              <EllipsisVerticalIcon className="h-6 w-6" />
              <span className="sr-only">Notes</span>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute right-0 top-0 z-10 -mx-4 mt-10 flex w-screen max-w-min sm:-mx-6 lg:-mx-8">
                {({ close }) => (
                  <div className="w-44 shrink rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-zinc-900 shadow-lg ring-1 ring-zinc-900/5">
                    {menuOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => {
                          close();
                          option.onClick();
                        }}
                        type="button"
                        className="block w-full text-left text-gray-600 hover:text-orange-600"
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
      </div>

      <h3 className="mt-3 text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
        {exercise.exercise.name}
      </h3>

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

          <Transition
            as={Fragment}
            show={showNotes}
            appear
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div>
              <Textarea
                autoSize
                hideLabel
                hideErrorMessage
                config={notes}
                label="Notes"
                placeholder="Notes"
                rows={1}
              />
            </div>
          </Transition>
        </Form>

        <div role="table">
          <div role="rowgroup">
            <div role="row" className="flex items-center gap-3">
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                Weight
              </div>
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                Rep range
              </div>
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                RIR
              </div>
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                Reps
              </div>

              <div role="columnheader" className="h-8 w-8" />
            </div>
          </div>

          <div role="rowgroup" className="flex flex-col gap-2">
            {exercise.sets.map((set, index) => (
              <SetRow index={index} key={set.id} set={set} />
            ))}
          </div>
        </div>

        <Form method="post" className="mt-4">
          <SubmitButton isSubmitting={isSubmitting} secondary text="Add set" />
        </Form>
      </div>
    </div>
  );
}

type SetRowProps = {
  set: NonNullable<
    CurrentMesocycleStartedData["today"]["trainingDay"]
  >["exercises"][number]["sets"][number];
  index: number;
};

function SetRow({ set, index }: SetRowProps) {
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

  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  // Set the drag hook and define component movement based on gesture data
  const bind = useDrag(({ down, movement: [mx, my] }) => {
    // Only allow dragging to the left.
    if (mx <= 0) {
      api.start({ x: down ? mx : 0, immediate: down });
    }
  });

  return (
    <animated.div
      {...bind()}
      role="row"
      aria-rowindex={index}
      className="touch-pan-y"
      style={{ x }}
    >
      <Form
        preventScrollReset
        replace
        method="post"
        className="flex items-center gap-3"
        {...form.props}
      >
        <div role="cell" className="flex-1">
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
        </div>

        <div role="cell" className="flex-1">
          <Input
            hideErrorMessage
            hideLabel
            config={repRange}
            label="Rep range"
            className="text-center"
            onChange={(e) => handleValueChange(e, "repRange")}
          />
        </div>

        <div role="cell" className="flex-1">
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
        </div>

        <div role="cell" className="flex-1">
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
        </div>

        <div role="cell">
          <button
            type="submit"
            name={wantsToComplete.name}
            value={values.completed ? "" : "true"}
            disabled={values.completed ? false : !canCompleteSet}
            className={clsx(
              "mt-1 flex h-8 w-8 items-center justify-center rounded transition-all",
              values.completed
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 disabled:text-zinc-400 disabled:hover:bg-zinc-200"
            )}
          >
            <CheckIcon className="h-5 w-5" />
            <span className="sr-only">
              {values.completed ? "Mark as complete" : "Mark as uncomplete"}
            </span>
          </button>
        </div>
      </Form>
    </animated.div>
  );
}
