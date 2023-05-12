import type { FieldConfig } from "@conform-to/react";
import { useFieldset } from "@conform-to/react";
import type { Schema } from "./route";
import { useRef } from "react";
import { Input } from "~/components/input";
import { Link } from "@remix-run/react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { MODAL_NAME } from "./add-exercise-modal";

type TrainingDayFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]>;
};

export function TrainingDayFieldset(props: TrainingDayFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { label } = useFieldset(ref, props.config);
  const dayNumber = props.config.defaultValue?.dayNumber;

  return (
    <>
      <fieldset ref={ref}>
        <div className="border-b border-zinc-200 px-4 py-5 sm:px-6">
          <p className="text-base font-semibold leading-6 text-zinc-900">
            Training Day {dayNumber}
          </p>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <Input
            label="Label"
            config={label}
            placeholder="Push A, Upper A..."
          />

          <Link
            className="mt-4 flex w-full items-center justify-center rounded bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
            to={`.?modal=${MODAL_NAME}&day_number=${dayNumber}`}
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add an exercise
          </Link>
        </div>
      </fieldset>
    </>
  );
}
