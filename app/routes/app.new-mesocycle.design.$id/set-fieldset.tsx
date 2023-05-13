import type { FieldConfig } from "@conform-to/react";
import { list } from "@conform-to/react";
import { useFieldset } from "@conform-to/react";
import { useRef } from "react";
import { Input } from "~/components/input";
import { TrashIcon } from "@heroicons/react/20/solid";
import type { Schema } from "./route";

type SetFieldsetProps = {
  setsConfig: FieldConfig<
    Schema["trainingDays"][number]["exercises"][number]["sets"]
  >;
  config: FieldConfig<
    Schema["trainingDays"][number]["exercises"][number]["sets"][number]
  >;
  setNumber: number;
};

export function SetFieldset({
  setsConfig,
  config,
  setNumber,
}: SetFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { rir, weight, repRange } = useFieldset(ref, config);

  return (
    <fieldset
      ref={ref}
      className="flex flex-col gap-4 xs:flex-row xs:items-end"
    >
      <Input label="RIR" config={rir} hideErrorMessage type="number" />
      <Input label="Reps" config={repRange} hideErrorMessage />
      <Input label="Weight" config={weight} hideErrorMessage type="number" />

      {setNumber > 1 ? (
        <button
          className="flex items-center justify-center rounded-md border-0 bg-red-50 px-2 py-1.5 text-sm text-red-700 ring-1 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600"
          {...list.remove(setsConfig.name, { index: setNumber - 1 })}
        >
          <TrashIcon className="h-5 w-5" />
          <span className="hidden">Remove set</span>
        </button>
      ) : null}
    </fieldset>
  );
}
