import { Heading } from "~/components/heading";
import type { CurrentMesocycleStartedData } from "./route";
import type { ChangeEvent, FormEvent } from "react";
import { useRef } from "react";
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
import { CheckIcon, TrashIcon } from "@heroicons/react/20/solid";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Input } from "~/components/input";
import type {
  AddSetSchema,
  UpdateExerciseSchema,
  UpdateSetSchema,
} from "./schema";
import { addSetSchema } from "./schema";
import { updateExerciseSchema } from "./schema";
import { actionIntents } from "./schema";
import { updateSetSchema } from "./schema";
import clsx from "clsx";
import { Textarea } from "~/components/textarea";
import { generateId, useDebounce, useMediaQuery } from "~/utils";
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
            <li key={exercise.id}>
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
  const [
    updateExerciseForm,
    {
      id: updateExerciseId,
      notes: updateExerciseNotes,
      actionIntent: updateExerciseActionIntent,
    },
  ] = useForm<UpdateExerciseSchema>({
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

  const [
    addSetForm,
    { id: addSetId, actionIntent: addSetActionintent, setId: addSetSetId },
  ] = useForm<AddSetSchema>({
    id: `add-set-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      setId: generateId(),
      actionIntent: actionIntents[3],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: addSetSchema });
    },
  });

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    setSubmitEvent(event);
  };

  useEffect(() => {
    if (debouncedSubmitEvent) {
      submit(updateExerciseForm.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [debouncedSubmitEvent, updateExerciseForm.ref, submit]);

  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));

  const menuOptions = [
    {
      name: "Add notes",
      onClick: () => {
        setShowNotes(true);
      },
    },
  ];

  const navigation = useNavigation();

  const isXs = useMediaQuery("(max-width: 600px)");

  const [sets, setSets] = useState(exercise.sets);

  // Optimistic UI to add a set.
  useEffect(() => {
    if (navigation.formData) {
      const actionIntent = navigation.formData.get("actionIntent");
      if (actionIntent === actionIntents[3]) {
        const id = navigation.formData.get("id");
        const setId = navigation.formData.get("setId");
        if (id === exercise.id && typeof setId === "string") {
          setSets((prevSets) => {
            const lastSet = prevSets.at(-1);

            return [
              ...prevSets,
              {
                id: setId,
                number: lastSet?.number ? lastSet.number + 1 : 1,
                repRangeLowerBound: lastSet?.repRangeLowerBound || 5,
                repRangeUpperBound: lastSet?.repRangeUpperBound || 8,
                weight: lastSet?.weight || 0,
                rir: lastSet?.rir || 0,
                completed: false,
                repsCompleted: 0,
              },
            ];
          });
        }
      }
    }
  }, [exercise.id, navigation.formData]);

  return (
    <div className="mx-auto w-full max-w-2xl rounded border-b border-zinc-200 bg-white pb-6 pt-4 sm:pb-10 ">
      <div className="flex items-center gap-8 px-4 sm:px-6 lg:px-8">
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

      <div className="mt-3 px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
          {exercise.exercise.name}
        </h3>
      </div>

      <div className="mt-3">
        <Form
          preventScrollReset
          replace
          method="post"
          className="px-4 sm:px-6 lg:px-8"
          onChange={handleChange}
          {...updateExerciseForm.props}
        >
          <input {...conform.input(updateExerciseId, { hidden: true })} />
          <input
            {...conform.input(updateExerciseActionIntent, { hidden: true })}
          />

          <Transition
            as={Fragment}
            show={showNotes}
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
                config={updateExerciseNotes}
                label="Notes"
                placeholder="Notes"
                rows={1}
                className="mb-4"
              />
            </div>
          </Transition>
        </Form>

        <div role="table">
          {sets.length > 0 ? (
            <div role="rowgroup">
              <div
                role="row"
                className="flex items-center gap-3 px-4 sm:px-6 lg:px-8"
              >
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
                <div role="columnheader" className="hidden h-8 w-8 sm:block" />
              </div>
            </div>
          ) : null}

          <div role="rowgroup" className="flex flex-col">
            {sets.map((set, index) => (
              <SetRow
                exerciseId={exercise.id}
                setSets={setSets}
                key={set.id}
                isXs={isXs}
                index={index}
                set={set}
              />
            ))}
          </div>
        </div>

        <Form
          preventScrollReset
          replace
          method="post"
          className={clsx("px-4 sm:px-6 lg:px-8", sets.length > 0 && "mt-4")}
          {...addSetForm.props}
        >
          <input {...conform.input(addSetId, { hidden: true })} />
          <input {...conform.input(addSetActionintent, { hidden: true })} />
          <input {...conform.input(addSetSetId, { hidden: true })} />

          <SubmitButton isSubmitting={false} secondary text="Add set" />
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
  isXs: boolean;
  exerciseId: string;
  setSets: React.Dispatch<
    React.SetStateAction<
      NonNullable<
        CurrentMesocycleStartedData["today"]["trainingDay"]
      >["exercises"][number]["sets"]
    >
  >;
};

function SetRow({ set, index, isXs, setSets, exerciseId }: SetRowProps) {
  const [isRemoved, setIsRemoved] = useState(false);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const bind = useDrag(({ down, movement: [mx], ...rest }) => {
    // Allow dragging to the left (to delete) and only on small screens.
    if (!isXs || mx > 0) return;

    api.start({ x: down ? mx : 0, immediate: down });

    // If user drags to the left (at least half screen) and releases the drag, remove the set.
    if (Math.abs(mx) >= innerWidth / 2 && !down) {
      setIsRemoved(true);
    }
  });

  useEffect(() => {
    if (isRemoved && isXs) {
      api.start({ x: -innerWidth, immediate: false });
      setSets((prevSets) => prevSets.filter(({ id }) => id !== set.id));
    }
  }, [api, isXs, set.id, setSets, isRemoved]);

  const removeSetButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Transition
      show={!isRemoved}
      appear
      unmount={false}
      afterLeave={() => {
        if (isXs) {
          removeSetButtonRef.current?.click();
        }
      }}
      enter="ease-out duration-300"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
      className="relative"
    >
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-4 py-1 sm:hidden">
        <TrashIcon className="h-5 w-5 text-white" />
        <span className="sr-only">Remove</span>
      </div>

      <animated.div
        {...bind()}
        role="row"
        aria-rowindex={index}
        className="relative cursor-grab touch-pan-y bg-white py-1 sm:cursor-auto"
        style={{ x }}
      >
        <SetRowForm
          exerciseId={exerciseId}
          removeSetButtonRef={removeSetButtonRef}
          set={set}
          isRemoved={isRemoved}
          setIsRemoved={setIsRemoved}
          setSets={setSets}
        />
      </animated.div>
    </Transition>
  );
}

type SetRowFormProps = {
  set: NonNullable<
    CurrentMesocycleStartedData["today"]["trainingDay"]
  >["exercises"][number]["sets"][number];
  setIsRemoved: React.Dispatch<React.SetStateAction<boolean>>;
  removeSetButtonRef: React.RefObject<HTMLButtonElement>;
  isRemoved: boolean;
  exerciseId: string;
  setSets: React.Dispatch<
    React.SetStateAction<
      NonNullable<
        CurrentMesocycleStartedData["today"]["trainingDay"]
      >["exercises"][number]["sets"]
    >
  >;
};

function SetRowForm({
  set,
  setIsRemoved,
  removeSetButtonRef,
  isRemoved,
  setSets,
  exerciseId,
}: SetRowFormProps) {
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
      wantsToRemove,
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
      repsCompleted: set.repsCompleted
        ? set.repsCompleted === 0
          ? undefined
          : set.repsCompleted.toString()
        : undefined,
      rir: set.rir.toString(),
      weight: set.weight
        ? set.weight === 0
          ? undefined
          : set.weight.toString()
        : undefined,
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

  const canCompleteSet = Boolean(
    values.repRange && values.repsCompleted && values.rir && values.weight
  );

  const navigation = useNavigation();

  // Optimistic UI to remove set
  useEffect(() => {
    if (navigation.formData) {
      const actionIntent = navigation.formData.get("actionIntent");
      if (actionIntent === actionIntents[0]) {
        const updatedSetId = navigation.formData.get("id");
        if (updatedSetId === set.id) {
          const wantsToRemove = navigation.formData.get("wantsToRemove");
          if (wantsToRemove) {
            if (!isRemoved) {
              setIsRemoved(true);
            }

            return;
          }

          const wantsToComplete = navigation.formData.get("wantsToComplete");
          if (typeof wantsToComplete === "string") {
            setSets((prevSets) =>
              prevSets.map((s) => {
                if (s.id !== set.id) {
                  return s;
                }

                return {
                  ...s,
                  completed: Boolean(wantsToComplete),
                };
              })
            );
          }
        }
      }
    }
  }, [isRemoved, navigation.formData, set.id, setIsRemoved, setSets]);

  useEffect(() => {
    if (set.completed !== Boolean(values.completed)) {
      setValues((currentValues) => ({
        ...currentValues,
        completed: set.completed ? "yes" : undefined,
      }));
    }
  }, [set.completed, values.completed]);

  const isBeingCreated =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === actionIntents[3] &&
    navigation.formData.get("id") === exerciseId;

  return (
    <Form
      preventScrollReset
      replace
      method="post"
      className="flex items-center gap-3 px-4 sm:px-6 lg:px-8"
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
          disabled={
            isBeingCreated ? true : values.completed ? false : !canCompleteSet
          }
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded transition-all",
            values.completed
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-zinc-200"
          )}
        >
          <CheckIcon className="h-5 w-5" />
          <span className="sr-only">
            {values.completed ? "Mark as complete" : "Mark as uncomplete"}
          </span>
        </button>
      </div>

      <div className="hidden sm:block" role="cell">
        <button
          ref={removeSetButtonRef}
          type="submit"
          disabled={isBeingCreated}
          name={wantsToRemove.name}
          value="true"
          className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-red-100"
        >
          <TrashIcon className="h-5 w-5" />
          <span className="sr-only">Remove</span>
        </button>
      </div>
    </Form>
  );
}
