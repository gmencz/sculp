import type { SerializeFrom } from "@remix-run/server-runtime";
import type { action, loader } from "./route";
import { Form, useActionData } from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import type { UpdateSetSchema } from "./schema";
import { Intent, updateSetSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import clsx from "clsx";
import { useDebouncedSubmit } from "~/utils/hooks";

type SetProps = {
  routine: Pick<
    SerializeFrom<typeof loader>["routine"],
    "trackRir" | "previousValuesFrom"
  >;
  set: SerializeFrom<
    typeof loader
  >["routine"]["exercises"][number]["sets"][number];
};

export function Set({ set, routine }: SetProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { id, intent, reps, rir, weight }] = useForm<UpdateSetSchema>({
    id: `update-set-${set.id}`,
    lastSubmission,
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
        className="table-cell py-2 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
      >
        <input {...conform.input(id, { hidden: true })} />
        <input {...conform.input(intent, { hidden: true })} />

        <button type="button" className="-m-2 p-2">
          {set.type === "NORMAL" ? (
            <span className="text-orange-500">{set.number}</span>
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
        className="table-cell py-2 pl-4 pr-3 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
      >
        <Input
          config={weight}
          type="number"
          label="Set Weight"
          hideLabel
          hideErrorMessage
          className="text-center"
        />
      </div>
      <div
        role="cell"
        className={clsx(
          "table-cell py-2 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50",
          routine.trackRir ? "pr-3" : "pr-4"
        )}
      >
        <Input
          config={reps}
          type="number"
          label="Set Reps"
          hideLabel
          hideErrorMessage
          className="text-center"
        />
      </div>

      {routine.trackRir ? (
        <div
          role="cell"
          className="table-cell py-2 pr-4 text-center text-sm font-medium uppercase text-zinc-900 dark:text-zinc-50"
        >
          <Input
            config={rir}
            type="number"
            label="Set RIR"
            hideLabel
            hideErrorMessage
            className="text-center"
          />
        </div>
      ) : null}
    </Form>
  );
}
