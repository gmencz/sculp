import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useFieldList } from "@conform-to/react";
import { list } from "@conform-to/react";
import { useFieldset } from "@conform-to/react";
import type { Schema } from "./route";
import type { RefObject } from "react";
import { useRef } from "react";
import { Input } from "~/components/input";
import { ExercisesAutocomplete } from "./exercises-autocomplete";
import { ErrorMessage } from "~/components/error-message";
import {
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { SetFieldset } from "./set-fieldset";
import { Textarea } from "~/components/textarea";
import { Disclosure } from "@headlessui/react";

type TrainingDayFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]>;
  formRef: RefObject<HTMLFormElement>;
  dayNumber: number;
};

export function TrainingDayFieldset(props: TrainingDayFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { label, exercises } = useFieldset(ref, props.config);
  const exercisesList = useFieldList(props.formRef, exercises);

  return (
    <fieldset ref={ref}>
      <div className="border-b border-zinc-200 px-4 py-5 sm:px-6">
        <p className="text-base font-semibold leading-6 text-zinc-900">
          Training Day {props.dayNumber}
        </p>
      </div>

      <div className="px-4 py-5 sm:px-6">
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
            Add an exercise
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
                />
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </fieldset>
  );
}

type ExerciseFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]["exercises"][number]>;
  exercisesConfig: FieldConfig<Schema["trainingDays"][number]["exercises"]>;
  index: number;
  formRef: RefObject<HTMLFormElement>;
};

function ExerciseFieldset(props: ExerciseFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { id, name, dayNumber, notes, sets } = useFieldset(ref, props.config);
  const setsList = useFieldList(props.formRef, sets);

  return (
    <fieldset ref={ref}>
      <input {...conform.input(dayNumber, { hidden: true })} />

      <ExercisesAutocomplete
        exerciseNumber={props.index + 1}
        idFieldConfig={id}
        nameFieldConfig={name}
      />

      <Disclosure defaultOpen>
        <Disclosure.Button className="mb-3 mt-4 flex w-full items-center justify-center rounded bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-40">
          {({ open }) => (
            <>
              {open ? (
                <>
                  <EyeSlashIcon
                    className="-ml-0.5 mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  <span>Hide details</span>
                </>
              ) : (
                <>
                  <EyeIcon
                    className="-ml-0.5 mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  <span>Show details</span>
                </>
              )}
            </>
          )}
        </Disclosure.Button>
        <Disclosure.Panel className="mb-6">
          <ul className="mt-4 flex flex-col gap-8 xs:gap-4">
            {setsList.map((set, index) => (
              <li key={set.key}>
                <SetFieldset
                  setsConfig={sets}
                  config={set}
                  setNumber={index + 1}
                />
              </li>
            ))}
          </ul>

          {setsList.length < 10 ? (
            <button
              className="mt-8 flex w-full items-center justify-center rounded bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 xs:mt-6"
              {...list.append(sets.name, {
                defaultValue: { rir: "1", repRange: "5-8", weight: "" },
              })}
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add set
            </button>
          ) : null}

          {sets.error ? (
            <p
              className="mt-2 text-sm text-red-500"
              id={sets.errorId}
              role="alert"
            >
              {sets.error}
            </p>
          ) : null}

          <div className="mt-6">
            <Textarea
              rows={4}
              label="Notes (Optional)"
              config={notes}
              placeholder="Seat on 4th setting, handles on 3rd setting..."
            />
          </div>
        </Disclosure.Panel>
      </Disclosure>

      <button
        className="flex w-full items-center justify-center rounded-md border-0 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600"
        {...list.remove(props.exercisesConfig.name, { index: props.index })}
      >
        <TrashIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
        Delete exercise
      </button>
    </fieldset>
  );
}
