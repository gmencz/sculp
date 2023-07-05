import type { SerializeFrom } from "@remix-run/server-runtime";
import type { SelectedSet, action, loader } from "./route";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import type { UpdateSetSchema } from "./schema";
import { Intent } from "./schema";
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
  previousSets: SerializeFrom<
    typeof loader
  >["routine"]["exercises"][number]["previousSets"];
  setSelectedSet: (value: React.SetStateAction<SelectedSet | null>) => void;
  setShowSetModal: (value: React.SetStateAction<boolean>) => void;
};

export function Set({
  set,
  routine,
  setSelectedSet,
  setShowSetModal,
  normalSets,
  previousSets,
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
    noValidate: true,
  });

  const submit = useDebouncedSubmit(form.ref.current, {
    preventScrollReset: true,
    replace: true,
    noValidate: true,
  });

  const previousSet = useMemo(
    () => previousSets.find((previousSet) => previousSet.number === set.number),
    [previousSets, set.number]
  );

  const normalSet = useMemo(
    () => normalSets.find((normalSet) => normalSet.id === set.id),
    [normalSets, set.id]
  );

  const isOptimisticSet = useMemo(
    () => set.id.startsWith("temp-new-"),
    [set.id]
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
          className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          onClick={() => {
            if (isOptimisticSet) return;

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
        {previousSet ? (
          routine.trackRir ? (
            <div className="flex flex-col gap-0.5">
              <span>
                {previousSet.weight} {weightUnitPreference.toLowerCase()} x{" "}
                {previousSet.reps}
              </span>
              <span className="text-xs">{previousSet.rir} RIR</span>
            </div>
          ) : (
            <span>
              {previousSet.weight} {weightUnitPreference.toLowerCase()} x{" "}
              {previousSet.reps}
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
          disabled={isOptimisticSet}
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
          routine.trackRir
            ? "w-[15%] pr-2 sm:w-auto"
            : "w-[26%] pr-3 sm:w-auto sm:pr-4"
        )}
      >
        <Input
          config={reps}
          disabled={isOptimisticSet}
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
          className="table-cell w-[15%] py-2 pr-3 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50 sm:w-auto sm:pr-4"
        >
          <Input
            config={rir}
            disabled={isOptimisticSet}
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
