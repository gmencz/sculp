import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { z } from "zod";
import { SubmitButton } from "~/components/submit-button";
import { Textarea } from "~/components/textarea";
import { ExercisesAutocomplete } from "./exercises-autocomplete";
import { SetFieldset } from "./set-fieldset";

export const schema = z.object({
  sets: z
    .array(
      z.object({
        rir: z.coerce
          .number({
            invalid_type_error: "The RIR is not valid.",
            required_error: "The RIR is required.",
          })
          .min(0, `The RIR can't be lower than 0.`)
          .max(100, `The RIR can't be higher than 100.`),

        weight: z.coerce
          .number({
            invalid_type_error: "The weight is not valid.",
            required_error: "The weight is required.",
          })
          .min(1, `The weight must be greater than 0.`)
          .max(10000, `The weight can't be greater than 10000.`),

        repRange: z
          .string({
            invalid_type_error: "The rep range is not valid.",
            required_error: "The rep range is required.",
          })
          .min(1, "The rep range is required.")
          .refine(
            (data) => {
              // Format: 5-8
              if (data.length !== 3 || data[1] !== "-") {
                return false;
              }

              const lowerBound = Number(data[0]);
              const upperBound = Number(data[2]);
              if (Number.isNaN(lowerBound) || Number.isNaN(upperBound)) {
                return false;
              }

              if (lowerBound >= upperBound) {
                return false;
              }

              return true;
            },
            { message: "The rep range is not valid." }
          ),
      })
    )
    .max(10, `The sets must be at most 10.`),

  name: z
    .string({
      invalid_type_error: "The exercise name is not valid.",
      required_error: "The exercise name is required.",
    })
    .min(1, "The exercise name is required."),

  id: z
    .string({
      invalid_type_error: "The exercise id is not valid.",
      required_error: "The exercise id is required.",
    })
    .min(1, "The exercise id is required."),

  notes: z
    .string({
      invalid_type_error: "The notes are not valid.",
    })
    .optional(),

  dayNumber: z.coerce
    .number({
      invalid_type_error: "The day number is not valid.",
      required_error: "The day number is required.",
    })
    .min(1, `The day number must be at least 1.`)
    .max(6, `The day number can't be greater than 6.`),
});

export type Schema = z.infer<typeof schema>;

export function AddExerciseForm() {
  const lastSubmission = useActionData();
  const [searchParams] = useSearchParams();
  const [form, { sets, notes, dayNumber, id, name }] = useForm<Schema>({
    id: "add-exercise",
    lastSubmission,
    defaultValue: {
      sets: [{ rir: "1", repRange: "5-8", weight: "0" }],
      dayNumber: searchParams.get("day_number") as string,
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const setsList = useFieldList(form.ref, sets);

  return (
    <Form className="flex flex-col gap-6" method="post" {...form.props}>
      <input type="hidden" name="intent" value="add-exercise" />
      <input {...conform.input(dayNumber, { hidden: true })} />

      <ExercisesAutocomplete idFieldConfig={id} nameFieldConfig={name} />

      <div className="mt-6">
        <p className="flex flex-col text-sm ">
          <span className="font-medium leading-6 text-zinc-900">Sets</span>

          <span className="mt-1 text-zinc-500">
            These are the sets you start the mesocycle with for this exercise.
            If you're not sure, we recommend 1 straight set with 0-2 RIR (Reps
            In Reserve) and 5-8 Reps.
          </span>
        </p>

        <div className="mt-4">
          <ul className="flex flex-col gap-8 xs:gap-4">
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
                defaultValue: { rir: "1", repRange: "5-8", weight: "0" },
              })}
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add set
            </button>
          ) : null}
        </div>

        {sets.error ? (
          <p
            className="mt-2 text-sm text-red-500"
            id={sets.errorId}
            role="alert"
          >
            {sets.error}
          </p>
        ) : null}
      </div>

      <Textarea
        rows={4}
        label="Notes (Optional)"
        config={notes}
        placeholder="Seat on 4th setting, handles on 3rd setting..."
      />

      <SubmitButton text="Save and continue" />
    </Form>
  );
}
