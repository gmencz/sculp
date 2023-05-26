import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { Set } from "./training-day-exercise-set";
import { conform, useForm } from "@conform-to/react";
import type { UpdateSetSchema } from "../schema";
import { actionIntents, updateSetSchema } from "../schema";
import { parse } from "@conform-to/zod";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { Input } from "~/components/input";
import clsx from "clsx";
import { CheckIcon, TrashIcon } from "@heroicons/react/20/solid";

type TrainingDayExerciseSetFormProps = {
  set: Set;
  setSets: React.Dispatch<React.SetStateAction<Set[]>>;
  setIsRemoved: React.Dispatch<React.SetStateAction<boolean>>;
  removeSetButtonRef: React.RefObject<HTMLButtonElement>;
  isRemoved: boolean;
  exerciseId: string;
};

export function TrainingDayExerciseSetForm({
  set,
  setIsRemoved,
  removeSetButtonRef,
  isRemoved,
  setSets,
  exerciseId,
}: TrainingDayExerciseSetFormProps) {
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
