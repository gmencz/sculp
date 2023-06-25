import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { Set } from "./training-day-exercise-set";
import { conform, useForm } from "@conform-to/react";
import type { UpdateSetSchema } from "../schema";
import { actionIntents, updateSetSchema } from "../schema";
import { parse } from "@conform-to/zod";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "~/components/input";
import clsx from "clsx";
import {
  CheckIcon,
  LockClosedIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import type { SerializeFrom } from "@remix-run/server-runtime";
import type { CurrentMesocycleState, loader } from "../route";

type TrainingDayExerciseSetFormProps = {
  set: Set;
  setSets: React.Dispatch<React.SetStateAction<Set[]>>;
  setIsRemoved: React.Dispatch<React.SetStateAction<boolean>>;
  removeSetButtonRef: React.RefObject<HTMLButtonElement>;
  isRemoved: boolean;
  exerciseId: string;
  previousSets: NonNullable<
    NonNullable<
      (SerializeFrom<typeof loader> & {
        state: CurrentMesocycleState.STARTED;
      })["day"]
    >["trainingDay"]
  >["exercises"][number]["previousSets"];
};

export function TrainingDayExerciseSetForm({
  set,
  setIsRemoved,
  removeSetButtonRef,
  isRemoved,
  setSets,
  exerciseId,
  previousSets,
}: TrainingDayExerciseSetFormProps) {
  const lastSubmission = useActionData() as any as any;
  const [
    form,
    {
      id,
      completed,
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
      repsCompleted: set.repsCompleted
        ? set.repsCompleted === 0
          ? undefined
          : set.repsCompleted.toString()
        : undefined,
      rir: set.rir.toString(),
      weight: set.weight?.toString(),
      actionIntent: actionIntents[0],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateSetSchema });
    },
  });

  const [values, setValues] = useState({
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
    values.repsCompleted && values.rir && !Number.isNaN(Number(values.weight))
  );

  const navigation = useNavigation();

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
            const weight = Number(navigation.formData.get("weight") as string);
            const rir = Number(navigation.formData.get("rir") as string);
            const repsCompleted = Number(
              navigation.formData.get("repsCompleted") as string
            );

            setSets((prevSets) =>
              prevSets.map((s) => {
                if (s.id !== set.id) {
                  return s;
                }

                return {
                  ...s,
                  completed: Boolean(wantsToComplete),
                  weight,
                  rir,
                  repsCompleted,
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

  const { isFutureSession } = useLoaderData<
    SerializeFrom<typeof loader> & {
      state: CurrentMesocycleState.STARTED;
    }
  >();

  const previousSet = useMemo(
    () => previousSets.find(({ number }) => number === set.number),
    [previousSets, set.number]
  );

  return (
    <Form
      preventScrollReset
      replace
      method="post"
      className="flex items-center gap-3 px-4 sm:px-6 lg:px-8"
      {...form.props}
    >
      <input {...conform.input(id, { hidden: true })} />
      <input {...conform.input(completed, { hidden: true })} />
      <input {...conform.input(actionIntent, { hidden: true })} />

      <div
        role="cell"
        className="flex-1 text-center text-sm font-medium text-zinc-700 dark:text-zinc-200"
      >
        <span className="tracking-tight">
          {/*  */}
          {previousSet
            ? `${previousSet.weight}x${previousSet.repsCompleted}`
            : "-"}
        </span>
      </div>

      <div role="cell" className="flex-1">
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
          readOnly={Boolean(values.completed)}
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
          readOnly={Boolean(values.completed)}
          placeholder={`${set.repRangeLowerBound}-${set.repRangeUpperBound}`}
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
          readOnly={Boolean(values.completed)}
        />
      </div>

      <div role="cell">
        {isFutureSession ? (
          <button
            type="submit"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 dark:text-zinc-600"
          >
            <LockClosedIcon className="h-5 w-5" />
            <span className="sr-only">Locked</span>
          </button>
        ) : (
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
                ? "bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500 dark:disabled:hover:bg-zinc-800"
            )}
          >
            <CheckIcon className="h-5 w-5" />
            <span className="sr-only">
              {values.completed ? "Mark as complete" : "Mark as uncomplete"}
            </span>
          </button>
        )}
      </div>

      <div className="hidden sm:block" role="cell">
        <button
          ref={removeSetButtonRef}
          type="submit"
          disabled={isBeingCreated}
          name={wantsToRemove.name}
          value="true"
          className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-red-100 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          <TrashIcon className="h-5 w-5" />
          <span className="sr-only">Remove</span>
        </button>
      </div>
    </Form>
  );
}
