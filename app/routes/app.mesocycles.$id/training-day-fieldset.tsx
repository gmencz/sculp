import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useFieldList } from "@conform-to/react";
import { list } from "@conform-to/react";
import { useFieldset } from "@conform-to/react";
import type { Schema } from "./route";
import type { RefObject } from "react";
import { useRef } from "react";
import { Input } from "~/components/input";
import { ErrorMessage } from "~/components/error-message";
import { ExerciseFieldset } from "./exercise-fieldset";

type TrainingDayFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]>;
  formRef: RefObject<HTMLFormElement>;
  dayNumber: number;
};

export function TrainingDayFieldset(props: TrainingDayFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { id, label, exercises } = useFieldset(ref, props.config);
  const exercisesList = useFieldList(props.formRef, exercises);

  return (
    <fieldset ref={ref}>
      <div className="border-b border-zinc-200 px-4 py-5 sm:px-6">
        <p className="text-base font-semibold leading-6 text-zinc-900">
          Training Day {props.dayNumber}
        </p>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <input {...conform.input(id, { hidden: true })} />

        <Input label="Label" config={label} placeholder="Push A, Upper A..." />

        {exercisesList.length <= 7 ? (
          <button
            className="mt-4 flex w-full items-center justify-center rounded bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
            {...list.append(exercises.name, {
              defaultValue: {
                dayNumber: props.dayNumber,
                sets: [{ rir: "1", repRange: "5-8", weight: "" }],
              },
            })}
          >
            Add exercise
          </button>
        ) : null}

        {exercises.error ? (
          <div className="mt-4">
            <ErrorMessage>{exercises.error}</ErrorMessage>
          </div>
        ) : null}

        {exercisesList.length ? (
          <ol className="mt-8 flex flex-col gap-12">
            {exercisesList.map((exercise, index) => (
              <li key={exercise.key}>
                <ExerciseFieldset
                  formRef={props.formRef}
                  config={exercise}
                  exercisesConfig={exercises}
                  index={index}
                  dayNumber={props.dayNumber}
                />
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </fieldset>
  );
}
