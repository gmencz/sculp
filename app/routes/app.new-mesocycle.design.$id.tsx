import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { getSession, requireUser } from "~/session.server";
import type { Schema as DraftMesocycleSchema } from "./app.new-mesocycle._index";
import {
  ArrowLongRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { z } from "zod";
import type { FieldConfig } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { conform, useFieldList, useFieldset, useForm } from "@conform-to/react";
import clsx from "clsx";
import { Fragment, useRef, useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useModal } from "~/utils";
import { Combobox, Dialog, Listbox, Tab, Transition } from "@headlessui/react";
import type { Exercise } from "@prisma/client";
import { prisma } from "~/db.server";
import { parse } from "@conform-to/zod";
import { Spinner } from "~/components/spinner";

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
                className="mt-2 text-xs text-red-500"
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
        className="fixed bottom-0 left-0 z-20 w-full"
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
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-md">
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
                  <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-orange-900/20 p-1">
                      {["Directory", "New"].map((category) => (
                        <Tab
                          key={category}
                          className={({ selected }) =>
                            clsx(
                              "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-orange-700",
                              "ring-white ring-opacity-60 ring-offset-2 ring-offset-orange-400 focus:outline-none focus:ring-2",
                              selected
                                ? "bg-white shadow"
                                : "text-orange-400 text-opacity-70 hover:bg-white/[0.12] hover:text-white"
                            )
                          }
                        >
                          {category}
                        </Tab>
                      ))}
                    </Tab.List>
                    <Tab.Panels className="mt-6">
                      <Tab.Panel>
                        <ExercisesDirectoryTab />
                      </Tab.Panel>

                      <Tab.Panel>
                        {/* New exercise */}
                        <Form method="post">
                          <input
                            type="hidden"
                            name="_action"
                            value="add-new-exercise"
                          />
                        </Form>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

const setsArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const repRangeLowerBoundArray = [];

const repRangeLUpperBoundArray = [];

const setTypesArray = ["Straight", "Myo-Rep", "Drop", "Cluster"] as const;

const exerciesDirectoryTabSchema = z.object({
  sets: z.coerce
    .number({
      invalid_type_error: "The selected sets are not valid.",
      required_error: "The selected sets are required.",
    })
    .min(setsArray[0], `The selected sets must be at least ${setsArray[0]}.`)
    .max(
      setsArray[setsArray.length - 1],
      `The selected sets must be at most ${setsArray[setsArray.length - 1]}.`
    ),

  exerciseId: z
    .string({
      invalid_type_error: "The exercise is not valid.",
      required_error: "The exercise is required.",
    })
    .min(1, "The exercise is required."),

  setType: z.enum(setTypesArray, {
    invalid_type_error: "The set type is not valid.",
    required_error: "The set type is required.",
  }),

  repRangeLowerBound: z.coerce
    .number({
      invalid_type_error: "The selected sets are not valid.",
      required_error: "The selected sets are required.",
    })
    .min(setsArray[0], `The selected sets must be at least ${setsArray[0]}.`)
    .max(
      setsArray[setsArray.length - 1],
      `The selected sets must be at most ${setsArray[setsArray.length - 1]}.`
    ),
});

type ExerciesDirectoryTabSchema = z.infer<typeof exerciesDirectoryTabSchema>;

function ExercisesDirectoryTab() {
  const isSubmitting = useNavigation().state === "submitting";
  const lastSubmission = useActionData();
  const [form, { sets, exerciseId, setType }] =
    useForm<ExerciesDirectoryTabSchema>({
      id: "new-mesocycle",
      lastSubmission,
      defaultValue: {
        setType: setTypesArray[0],
        sets: setsArray[0].toString(),
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  const [setsValue, setSetsValue] = useState(sets.defaultValue ?? "");

  const [setsRef, setsControl] = useInputEvent({
    onReset: () => setSetsValue(sets.defaultValue ?? ""),
  });

  const setsButtonRef = useRef<HTMLButtonElement>(null);

  const [setTypeValue, setSetTypeValue] = useState(setType.defaultValue ?? "");

  const [setTypeRef, setTypeControl] = useInputEvent({
    onReset: () => setSetTypeValue(setType.defaultValue ?? ""),
  });

  const setTypeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Form method="post" {...form.props}>
      <ExercisesDirectoryAutocomplete fieldConfig={exerciseId} />

      <div className="mt-6">
        <div className="mt-2">
          <input
            ref={setTypeRef}
            {...conform.input(sets, { hidden: true })}
            onChange={(e) => setSetTypeValue(e.target.value)}
            onFocus={() => setTypeButtonRef.current?.focus()}
          />

          <Listbox
            value={setTypeValue}
            onChange={(value) => setTypeControl.change({ target: { value } })}
          >
            {({ open }) => (
              <>
                <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
                  What type of set?
                </Listbox.Label>

                <div className="relative mt-2">
                  <Listbox.Button
                    ref={setTypeButtonRef}
                    className={clsx(
                      "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600",
                      sets.error
                        ? "text-red-300 ring-red-500 focus:ring-red-600"
                        : "focus:ring-orange-600"
                    )}
                  >
                    <span className="block truncate">{setTypeValue}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-zinc-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {setTypesArray.map((setType) => (
                        <Listbox.Option
                          key={setType}
                          className={({ active }) =>
                            clsx(
                              active
                                ? "bg-orange-600 text-white"
                                : "text-zinc-900",
                              "relative cursor-default select-none py-2 pl-3 pr-9"
                            )
                          }
                          value={setType}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={clsx(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {setType}
                              </span>

                              {selected ? (
                                <span
                                  className={clsx(
                                    active ? "text-white" : "text-orange-600",
                                    "absolute inset-y-0 right-0 flex items-center pr-4"
                                  )}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  If you're not sure, we recommend starting with a straight set.
                </p>
              </>
            )}
          </Listbox>

          {sets.error ? (
            <p
              className="mt-2 text-xs text-red-500"
              id={sets.errorId}
              role="alert"
            >
              {sets.error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="mt-2">
          <input
            ref={setsRef}
            {...conform.input(sets, { hidden: true })}
            onChange={(e) => setSetsValue(e.target.value)}
            onFocus={() => setsButtonRef.current?.focus()}
          />

          <Listbox
            value={setsValue}
            onChange={(value) => setsControl.change({ target: { value } })}
          >
            {({ open }) => (
              <>
                <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
                  How many sets?
                </Listbox.Label>

                <div className="relative mt-2">
                  <Listbox.Button
                    ref={setsButtonRef}
                    className={clsx(
                      "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600",
                      sets.error
                        ? "text-red-300 ring-red-500 focus:ring-red-600"
                        : "focus:ring-orange-600"
                    )}
                  >
                    <span className="block truncate">{setsValue}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-zinc-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {setsArray.map((set) => (
                        <Listbox.Option
                          key={set}
                          className={({ active }) =>
                            clsx(
                              active
                                ? "bg-orange-600 text-white"
                                : "text-zinc-900",
                              "relative cursor-default select-none py-2 pl-3 pr-9"
                            )
                          }
                          value={set}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={clsx(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {set}
                              </span>

                              {selected ? (
                                <span
                                  className={clsx(
                                    active ? "text-white" : "text-orange-600",
                                    "absolute inset-y-0 right-0 flex items-center pr-4"
                                  )}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>

                <p className="mt-2 text-sm text-zinc-500">
                  This is the amount of sets you start the mesocycle with. They
                  will be auto-regulated by the app and you can also
                  self-regulate them as you train. If you're not sure, we
                  recommend starting with 1.
                </p>
              </>
            )}
          </Listbox>

          {sets.error ? (
            <p
              className="mt-2 text-xs text-red-500"
              id={sets.errorId}
              role="alert"
            >
              {sets.error}
            </p>
          ) : null}
        </div>
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

type ExercisesDirectoryAutocompleteProps = {
  fieldConfig: FieldConfig<ExerciesDirectoryTabSchema["exerciseId"]>;
};

function ExercisesDirectoryAutocomplete({
  fieldConfig,
}: ExercisesDirectoryAutocompleteProps) {
  const { exercises } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState<(typeof exercises)[0]>();
  const [query, setQuery] = useState("");

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
        value={selected?.id}
        {...conform.input(fieldConfig, { hidden: true })}
      />

      <Combobox value={selected} onChange={setSelected}>
        <label
          htmlFor="exercise-search"
          className="block text-sm font-medium leading-6 text-zinc-900"
        >
          What exercise do you want to add?
        </label>
        <div className="relative z-10 mt-2">
          <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left text-sm ring-1 ring-zinc-300 focus-within:ring-2 focus-within:ring-orange-500 focus:outline-none">
            <Combobox.Input
              id="exercise-search"
              className="w-full border-none py-1.5 pl-3 pr-10 text-sm leading-5 text-zinc-900 "
              displayValue={(exercise: (typeof exercises)[0]) => exercise.name}
              onChange={(event) => setQuery(event.target.value)}
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
                    value={exercise}
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
          className="mt-2 text-xs text-red-500"
          id={fieldConfig.errorId}
          role="alert"
        >
          {fieldConfig.error}
        </p>
      ) : null}
    </div>
  );
}
