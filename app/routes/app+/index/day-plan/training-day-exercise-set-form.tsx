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
import { useEffect, useState } from "react";
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
};

export function TrainingDayExerciseSetForm({
  set,
  setIsRemoved,
  removeSetButtonRef,
  isRemoved,
  setSets,
  exerciseId,
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

  const hitTargetRepRange =
    (set.repsCompleted || 0) >= set.repRangeLowerBound &&
    (set.repsCompleted || 0) <= set.repRangeUpperBound;

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
        className="flex flex-1 items-center justify-center gap-2 text-center text-sm font-medium text-zinc-700"
      >
        <span>
          {set.repRangeLowerBound}-{set.repRangeUpperBound}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={clsx("h-5 w-5", hitTargetRepRange && "text-green-500")}
          fill="currentColor"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
        </svg>
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
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-400"
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
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-zinc-200"
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
          className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-red-100"
        >
          <TrashIcon className="h-5 w-5" />
          <span className="sr-only">Remove</span>
        </button>
      </div>
    </Form>
  );
}
