import type { SerializeFrom } from "@remix-run/server-runtime";
import type { SelectedSet, action, loader } from "./route";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import type { UpdateSetSchema } from "./schema";
import { Intent, updateSetSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import clsx from "clsx";
import { useDebouncedSubmit } from "~/utils/hooks";
import { useMemo } from "react";

type SetProps = {
  routine: Pick<
    SerializeFrom<typeof loader>["routine"],
    "trackRir" | "previousValuesFrom"
  >;
  normalSets: {
    id: string;
    number: number;
  }[];
  set: SerializeFrom<
    typeof loader
  >["routine"]["exercises"][number]["sets"][number];
  setSelectedSet: (value: React.SetStateAction<SelectedSet | null>) => void;
  setShowSetModal: (value: React.SetStateAction<boolean>) => void;
};

export function Set({
  set,
  routine,
  setSelectedSet,
  setShowSetModal,
  normalSets,
}: SetProps) {
  const lastSubmission = useActionData<typeof action>();
  const { weightUnitPreference } = useLoaderData<typeof loader>();
  const lastSubmissionSetId = lastSubmission?.payload.id as unknown as string;
  const [form, { id, intent, reps, rir, weight }] = useForm<UpdateSetSchema>({
    id: `update-set-${set.id}`,
    lastSubmission: lastSubmissionSetId === set.id ? lastSubmission : undefined,
    defaultValue: {
      intent: Intent.UPDATE_SET,
      id: set.id,
      reps: set.reps,
      rir: set.rir,
      weight: set.weight,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateSetSchema });
    },
  });

  const submit = useDebouncedSubmit(form.ref.current, {
    preventScrollReset: true,
    replace: true,
  });

  set.previous = {
    number: set.number,
    id: "123",
    reps: 5,
    weight: 60,
    rir: 0,
    type: "NORMAL",
  };

  const normalSet = useMemo(
    () => normalSets.find((normalSet) => normalSet.id === set.id),
    [normalSets, set.id]
  );

  return (
    <Form
      method="post"
      role="row"
      className="table-row"
      preventScrollReset
      replace
      onChange={submit}
      {...form.props}
    >
      <div
        role="cell"
        className="table-cell w-[1%] py-2 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
      >
        <input {...conform.input(id, { hidden: true })} />
        <input {...conform.input(intent, { hidden: true })} />

        <button
          type="button"
          className="-m-2 p-2"
          onClick={() => {
            setSelectedSet({
              id: set.id,
            });

            setShowSetModal(true);
          }}
        >
          {set.type === "NORMAL" ? (
            <span className="text-orange-500">
              {normalSet?.number || set.number}
            </span>
          ) : set.type === "CLUSTER" ? (
            <span className="text-purple-600">C</span>
          ) : set.type === "DROP" ? (
            <span className="text-lime-500">D</span>
          ) : set.type === "WARM_UP" ? (
            <span className="text-blue-400">W</span>
          ) : null}
        </button>
      </div>
      <div
        role="cell"
        className="table-cell w-[1%] whitespace-nowrap py-2 pl-5 text-center align-middle text-sm2 font-medium tracking-tight text-zinc-700 dark:text-zinc-300"
      >
        {set.previous ? (
          routine.trackRir ? (
            <div className="flex flex-col gap-0.5">
              <span>
                {set.previous.weight} {weightUnitPreference.toLowerCase()} x{" "}
                {set.previous.reps}
              </span>
              <span className="text-xs">{set.previous.rir} RIR</span>
            </div>
          ) : (
            <span>
              {set.previous.weight} {weightUnitPreference.toLowerCase()} x{" "}
              {set.previous.reps}
            </span>
          )
        ) : (
          <span>-</span>
        )}
      </div>
      <div
        role="cell"
        className={clsx(
          "table-cell py-2 pl-5 pr-2 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50",
          routine.trackRir ? "w-[25%] sm:w-auto" : "w-[30%] sm:w-auto"
        )}
      >
        <Input
          config={weight}
          type="number"
          label="Set Weight"
          hideLabel
          hideErrorMessage
          className="!py-1.5 px-1 text-center !text-sm"
        />
      </div>
      <div
        role="cell"
        className={clsx(
          "table-cell py-2 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50",
          routine.trackRir ? "w-[15%] pr-2 sm:w-auto" : "w-[26%] pr-3 sm:w-auto"
        )}
      >
        <Input
          config={reps}
          type="number"
          label="Set Reps"
          hideLabel
          hideErrorMessage
          className="!py-1.5 px-1 text-center !text-sm"
        />
      </div>

      {routine.trackRir ? (
        <div
          role="cell"
          className="table-cell w-[15%] py-2 pr-3 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50 sm:w-auto"
        >
          <Input
            config={rir}
            type="number"
            label="Set RIR"
            hideLabel
            hideErrorMessage
            className="!py-1.5 text-center !text-sm"
          />
        </div>
      ) : null}
    </Form>
  );
}
