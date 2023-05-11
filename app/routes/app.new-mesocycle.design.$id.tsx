import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { getSession, requireUser } from "~/session.server";
import type { Schema as DraftMesocycleSchema } from "./app.new-mesocycle._index";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronUpDownIcon,
  ExclamationCircleIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { z } from "zod";
import type { FieldConfig } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { list } from "@conform-to/react";
import { conform, useFieldList, useFieldset, useForm } from "@conform-to/react";
import clsx from "clsx";
import { Fragment, useRef, useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useModal } from "~/utils";
import { Combobox, Dialog, Transition } from "@headlessui/react";
import { prisma } from "~/db.server";
import { parse } from "@conform-to/zod";
import { Spinner } from "~/components/spinner";

export const action = async ({ request }: ActionArgs) => {
  await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  throw new Error("Not implemented");
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    return redirect("/app/new-mesocycle");
  }

  const session = await getSession(request);
  const mesocycleDetails = (await session.get(
    `mesocycle-${id}`
  )) as DraftMesocycleSchema;

  const exercises = await prisma.exercise.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return json({
    mesocycleDetails,
    exercises,
  });
};

const schema = z.object({
  trainingDays: z.array(
    z.object({
      label: z
        .string({
          invalid_type_error: "The label is not valid.",
          required_error: "The label is required.",
        })
        .min(1, "The label is required.")
        .max(50, "The label must be at most 50 characters long."),
    })
  ),
});

type Schema = z.infer<typeof schema>;

export default function NewMesocycleDesign() {
  const { mesocycleDetails } = useLoaderData<typeof loader>();

  const [form, { trainingDays }] = useForm<Schema>({
    defaultValue: {
      trainingDays: Array.from(
        { length: mesocycleDetails.trainingDaysPerWeek },
        () => ({ label: "", muscleGroups: "" })
      ),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  return (
    <>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {mesocycleDetails.name}
        </h1>
        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-zinc-500">
            <CalendarDaysIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
              aria-hidden="true"
            />
            {mesocycleDetails.trainingDaysPerWeek} weeks
          </div>
          <div className="mt-2 flex items-center text-sm text-zinc-500">
            <CalendarIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
              aria-hidden="true"
            />
            {mesocycleDetails.trainingDaysPerWeek} days per week
          </div>
          <div className="mt-2 flex items-center text-sm text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
            </svg>
            {mesocycleDetails.goal}
          </div>
        </div>
      </div>

      <Form method="post" className="mt-6" {...form.props}>
        <ul className="flex flex-wrap gap-6">
          {trainingDaysList.map((trainingDay, index) => (
            <li
              className="max-w-sm flex-grow rounded border border-zinc-200 bg-white sm:min-w-[18rem]"
              key={trainingDay.key}
            >
              <TrainingDayFieldset dayNumber={index + 1} config={trainingDay} />
            </li>
          ))}
        </ul>
      </Form>

      <AddExerciseModal />
    </>
  );
}

type TrainingDayFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]>;
  dayNumber: number;
};

function TrainingDayFieldset(props: TrainingDayFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { label } = useFieldset(ref, props.config);

  return (
    <>
      <fieldset ref={ref}>
        <div className="border-b border-zinc-200 px-4 py-5 sm:px-6">
          <p className="text-base font-semibold leading-6 text-zinc-900">
            Training Day {props.dayNumber}
          </p>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div>
            <label
              htmlFor={label.id}
              className="block text-sm font-medium leading-6 text-zinc-900"
            >
              Label
            </label>
            <div className="mt-2">
              <input
                className={clsx(
                  "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:leading-6",
                  label.error
                    ? "text-red-300 ring-red-500 focus:ring-red-600"
                    : "focus:ring-orange-600"
                )}
                placeholder="Push A, Upper A..."
                {...conform.input(label, { type: "text" })}
              />
            </div>
            {label.error ? (
              <p
                className="mt-2 text-sm text-red-500"
                id={label.errorId}
                role="alert"
              >
                {label.error}
              </p>
            ) : null}
          </div>

          <Link
            className="mt-4 flex w-full items-center justify-center rounded bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
            to={`.?modal=${MODAL_NAME}&day_number=${props.dayNumber}`}
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add an exercise
          </Link>
        </div>
      </fieldset>
    </>
  );
}

const MODAL_NAME = "add_exercise";

function AddExerciseModal() {
  const { show, closeModal } = useModal(MODAL_NAME, ["day_number"]);
  const [searchParams] = useSearchParams();

  return (
    <Transition.Root show={show} as={Fragment} appear>
      <Dialog
        as="div"
        className="fixed bottom-0 left-0 z-50 w-full"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-10 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-lg">
                <div className="flex items-center gap-4">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-zinc-950"
                  >
                    <span>
                      Add an exercise to day {searchParams.get("day_number")}
                    </span>
                  </Dialog.Title>

                  <button
                    type="button"
                    className="ml-auto rounded-md bg-zinc-100 p-1 hover:bg-zinc-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                    onClick={closeModal}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4">
                  <AddExerciseForm />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

const addExerciseFormSchema = z.object({
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

  exerciseId: z
    .string({
      invalid_type_error: "The exercise is not valid.",
      required_error: "The exercise is required.",
    })
    .min(1, "The exercise is required."),

  notes: z
    .string({
      invalid_type_error: "The notes are not valid.",
    })
    .optional(),
});

type AddExerciseFormSchema = z.infer<typeof addExerciseFormSchema>;

function AddExerciseForm() {
  const isSubmitting = useNavigation().state === "submitting";
  const lastSubmission = useActionData();
  const [form, { sets, exerciseId, notes }] = useForm<AddExerciseFormSchema>({
    id: "add-exercise",
    lastSubmission,
    defaultValue: {
      sets: [{ rir: "1", repRange: "5-8", weight: "0" }],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: addExerciseFormSchema });
    },
  });

  const setsList = useFieldList(form.ref, sets);

  return (
    <Form method="post" {...form.props}>
      <ExercisesDirectoryAutocomplete fieldConfig={exerciseId} />

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

      <div className="mt-6">
        <label
          htmlFor={notes.name}
          className="block text-sm font-medium leading-6 text-zinc-900"
        >
          Notes (optional)
        </label>
        <div className="mt-2">
          <textarea
            rows={4}
            className={clsx(
              "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
              notes.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "focus:ring-orange-600"
            )}
            placeholder="Seat on 4th setting, handles on 3rd setting..."
            {...conform.textarea(notes)}
          />
        </div>
        {notes.error ? (
          <p
            className="mt-2 text-sm text-red-500"
            id={notes.errorId}
            role="alert"
          >
            {notes.error}
          </p>
        ) : null}
      </div>

      <button
        disabled={isSubmitting}
        type="submit"
        className="mt-6 inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? <Spinner /> : null}
        Save and continue
      </button>
    </Form>
  );
}

type SetFieldsetProps = {
  setsConfig: FieldConfig<AddExerciseFormSchema["sets"]>;
  config: FieldConfig<AddExerciseFormSchema["sets"][number]>;
  setNumber: number;
};

function SetFieldset({ setsConfig, config, setNumber }: SetFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { rir, weight, repRange } = useFieldset(ref, config);

  return (
    <fieldset
      ref={ref}
      className="flex flex-col gap-4 xs:flex-row xs:items-end"
    >
      <span className="flex items-center justify-center rounded-md border-0 bg-orange-50 px-4 py-1.5 text-sm text-orange-700 ring-1 ring-orange-100 xs:self-end">
        S{setNumber}
      </span>

      <div>
        <label
          htmlFor={rir.id}
          className="block text-sm font-medium leading-6 text-zinc-900"
        >
          RIR
        </label>
        <div className="relative mt-1 rounded-md">
          <input
            className={clsx(
              "block w-full rounded-md border-0 py-1.5 pr-10 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
              rir.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "ring-zinc-300 focus:ring-orange-600"
            )}
            {...conform.input(rir, { type: "number" })}
          />

          {rir.error ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor={repRange.id}
          className="block text-sm font-medium leading-6 text-zinc-900"
        >
          Reps
        </label>
        <div className="relative mt-1 rounded-md">
          <input
            className={clsx(
              "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
              repRange.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "ring-zinc-300 focus:ring-orange-600"
            )}
            {...conform.input(repRange, { type: "text" })}
          />

          {repRange.error ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor={weight.id}
          className="block text-sm font-medium leading-6 text-zinc-900"
        >
          Weight
        </label>
        <div className="relative mt-1 rounded-md">
          <input
            className={clsx(
              "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
              weight.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "ring-zinc-300 focus:ring-orange-600"
            )}
            {...conform.input(weight, { type: "number" })}
          />

          {weight.error ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          ) : null}
        </div>
      </div>

      {setNumber > 1 ? (
        <button
          className="flex items-center justify-center rounded-md border-0 bg-red-50 px-4 py-1.5 text-sm text-red-700 ring-1 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600"
          {...list.remove(setsConfig.name, { index: setNumber - 1 })}
        >
          <TrashIcon className="h-5 w-5" />
          <span className="hidden">Remove set</span>
        </button>
      ) : null}
    </fieldset>
  );
}

type ExercisesDirectoryAutocompleteProps = {
  fieldConfig: FieldConfig<AddExerciseFormSchema["exerciseId"]>;
};

function ExercisesDirectoryAutocomplete({
  fieldConfig,
}: ExercisesDirectoryAutocompleteProps) {
  const { exercises } = useLoaderData<typeof loader>();
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(fieldConfig.defaultValue ?? "");
  const [ref, control] = useInputEvent({
    onReset: () => setValue(fieldConfig.defaultValue ?? ""),
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredExercises =
    query === ""
      ? exercises
      : exercises.filter((exercise) =>
          exercise.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  return (
    <div>
      <input
        ref={ref}
        {...conform.input(fieldConfig, { hidden: true })}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => inputRef.current?.focus()}
      />

      <Combobox value={value} onChange={control.change}>
        <label
          htmlFor="exercise-search"
          className="block text-sm font-medium leading-6 text-zinc-900"
        >
          What exercise do you want to add?
        </label>
        <div className="relative z-10 mt-2">
          <div
            className={clsx(
              "relative w-full cursor-default overflow-hidden rounded-md bg-white text-left text-sm ring-1 ring-zinc-300 focus-within:ring-2 focus-within:ring-orange-500 focus:outline-none",
              fieldConfig.error ? "" : ""
            )}
          >
            <Combobox.Input
              ref={inputRef}
              id="exercise-search"
              className="w-full border-none py-1.5 pl-3 pr-10 text-sm leading-5 text-zinc-900"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(exerciseId: string) =>
                exercises.find((e) => `${e.id}` === exerciseId)?.name ?? ""
              }
              placeholder="Search..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-zinc-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredExercises.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-zinc-700">
                  No exercises found
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <Combobox.Option
                    key={exercise.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-orange-600 text-white" : "text-zinc-900"
                      }`
                    }
                    value={exercise.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {exercise.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-orange-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {fieldConfig.error ? (
        <p
          className="mt-2 text-sm text-red-500"
          id={fieldConfig.errorId}
          role="alert"
        >
          {fieldConfig.error}
        </p>
      ) : null}
    </div>
  );
}
