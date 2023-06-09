import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import type { Set } from "./training-day-exercise-set";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Input } from "~/components/input";
import { TrashIcon } from "@heroicons/react/20/solid";
import { getRepRangeBounds } from "~/utils/rep-ranges";
import type { UpdateSetSchema } from "./schema";
import { actionIntents, updateSetSchema } from "./schema";
import { useDebounce } from "~/utils/hooks";

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
  const [form, { id, repRange, rir, weight, actionIntent, wantsToRemove }] =
    useForm<UpdateSetSchema>({
      id: `set-${set.id}`,
      lastSubmission,
      defaultValue: {
        id: set.id,
        repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
        rir: set.rir.toString(),
        weight: set.weight?.toString(),
        actionIntent: actionIntents[0],
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateSetSchema });
      },
    });

  const [values, setValues] = useState({
    repRange: repRange.defaultValue,
    rir: rir.defaultValue,
    weight: weight.defaultValue,
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
            const repRange = navigation.formData.get("repRange") as string;
            const weight = Number(navigation.formData.get("weight") as string);
            const rir = Number(navigation.formData.get("rir") as string);
            const repsCompleted = Number(
              navigation.formData.get("repsCompleted") as string
            );

            const [repRangeLowerBound, repRangeUpperBound] =
              getRepRangeBounds(repRange);

            setSets((prevSets) =>
              prevSets.map((s) => {
                if (s.id !== set.id) {
                  return s;
                }

                return {
                  ...s,
                  completed: Boolean(wantsToComplete),
                  repRangeLowerBound,
                  repRangeUpperBound,
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

  const isBeingCreated =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === actionIntents[2] &&
    navigation.formData.get("id") === exerciseId;

  const submit = useSubmit();

  const [submitEvent, setSubmitEvent] = useState<FormEvent<HTMLFormElement>>();
  const debouncedSubmitEvent = useDebounce(submitEvent, 3000);

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    setSubmitEvent(event);
  };

  useEffect(() => {
    if (debouncedSubmitEvent) {
      submit(form.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [form.ref, submit, debouncedSubmitEvent]);

  return (
    <Form
      preventScrollReset
      replace
      method="post"
      className="flex items-center gap-3 px-4 sm:px-6 lg:px-8"
      onChange={handleFormChange}
      {...form.props}
    >
      <div role="cell" className="flex-1">
        <input {...conform.input(id, { hidden: true })} />
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
