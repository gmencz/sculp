import { conform, useForm, useInputEvent } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import clsx from "clsx";
import { nanoid } from "nanoid";
import { Fragment, useRef, useState } from "react";
import { z } from "zod";
import { Spinner } from "~/components/spinner";
import { sessionStorage } from "~/session.server";
import { getSession, requireUser } from "~/session.server";
import type { DraftMesocycle } from "./app.new-mesocycle.design.$id";

const durationInWeeksArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const trainingDaysPerWeekArray = [1, 2, 3, 4, 5, 6];

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

const schema = z.object({
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .min(1, "The name is required.")
    .max(1024, "The name must be at most 1024 characters long."),

  durationInWeeks: z.coerce
    .number({
      invalid_type_error: "The selected weeks are not valid.",
      required_error: "The selected weeks are required.",
    })
    .min(
      durationInWeeksArray[0],
      `The selected weeks must be at least ${durationInWeeksArray[0]}.`
    )
    .max(
      durationInWeeksArray[durationInWeeksArray.length - 1],
      `The selected weeks must be at most ${
        durationInWeeksArray[durationInWeeksArray.length - 1]
      }.`
    ),

  trainingDaysPerWeek: z.coerce
    .number({
      invalid_type_error: "The selected days are not valid.",
      required_error: "The selected days are required.",
    })
    .min(
      trainingDaysPerWeekArray[0],
      `The selected days must be at least ${trainingDaysPerWeekArray[0]}.`
    )
    .max(
      trainingDaysPerWeekArray[trainingDaysPerWeekArray.length - 1],
      `The selected days must be at most ${
        trainingDaysPerWeekArray[trainingDaysPerWeekArray.length - 1]
      }.`
    ),

  goal: z
    .string({
      invalid_type_error: "The goal is not valid.",
      required_error: "The goal is required.",
    })
    .min(1, "The goal is required.")
    .max(1024, "The goal must be at most 1024 characters long."),
});

export type Schema = z.infer<typeof schema>;

export const action = async ({ request }: ActionArgs) => {
  await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const session = await getSession(request);

  const mesocycle: DraftMesocycle = {
    durationInWeeks: submission.value.durationInWeeks,
    goal: submission.value.goal,
    name: submission.value.name,
    trainingDaysPerWeek: submission.value.trainingDaysPerWeek,
    trainingDays: Array.from(
      { length: submission.value.trainingDaysPerWeek },
      () => ({ label: "", exercises: [] })
    ),
  };

  const id = nanoid();
  session.set(`mesocycle-${id}`, mesocycle);
  return redirect(`/app/new-mesocycle/design/${id}`, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};

export default function NewMesocycle() {
  const isSubmitting = useNavigation().state === "submitting";
  const lastSubmission = useActionData();
  const [form, { name, durationInWeeks, goal, trainingDaysPerWeek }] =
    useForm<Schema>({
      id: "new-mesocycle",
      lastSubmission,
      defaultValue: {
        durationInWeeks: "Select weeks",
        trainingDaysPerWeek: "Select days",
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  const [durationInWeeksValue, setDurationInWeeksValue] = useState(
    durationInWeeks.defaultValue ?? ""
  );

  const [durationInWeeksRef, durationInWeeksControl] = useInputEvent({
    onReset: () => setDurationInWeeksValue(durationInWeeks.defaultValue ?? ""),
  });

  const durationInWeeksButtonRef = useRef<HTMLButtonElement>(null);

  const [trainingDaysPerWeekValue, setTrainingDaysPerWeekValue] = useState(
    trainingDaysPerWeek.defaultValue ?? ""
  );

  const [trainingDaysPerWeekRef, trainingDaysPerWeekControl] = useInputEvent({
    onReset: () =>
      setTrainingDaysPerWeekValue(trainingDaysPerWeek.defaultValue ?? ""),
  });

  const trainingDaysPerWeekButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Plan a new mesocycle
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          A mesocycle is a structured training plan designed to help you achieve
          maximum muscle growth. Here you can build your own to fit your
          preferences and needs.
        </p>
      </div>

      <Form
        method="post"
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
        {...form.props}
      >
        <div className="px-4 py-6 sm:p-8">
          <div>
            <label
              htmlFor={name.id}
              className="block text-sm font-medium leading-6 text-zinc-900"
            >
              How do you want to name the mesocycle?
            </label>
            <div className="mt-2">
              <input
                className={clsx(
                  "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
                  name.error
                    ? "text-red-300 ring-red-500 focus:ring-red-600"
                    : "focus:ring-orange-600"
                )}
                placeholder="My New Mesocycle"
                {...conform.input(name, { type: "text" })}
              />
            </div>
            {name.error ? (
              <p
                className="mt-2 text-sm text-red-500"
                id={name.errorId}
                role="alert"
              >
                {name.error}
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <div className="mt-2">
              <input
                ref={durationInWeeksRef}
                {...conform.input(durationInWeeks, { hidden: true })}
                onChange={(e) => setDurationInWeeksValue(e.target.value)}
                onFocus={() => durationInWeeksButtonRef.current?.focus()}
              />

              <Listbox
                value={durationInWeeksValue}
                onChange={(value) =>
                  durationInWeeksControl.change({ target: { value } })
                }
              >
                {({ open }) => (
                  <>
                    <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
                      How many weeks will the mesocycle last?
                    </Listbox.Label>

                    <div className="relative mt-2">
                      <Listbox.Button
                        ref={durationInWeeksButtonRef}
                        className={clsx(
                          "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600",
                          durationInWeeks.error
                            ? "text-red-300 ring-red-500 focus:ring-red-600"
                            : "focus:ring-orange-600"
                        )}
                      >
                        <span className="block truncate">
                          {durationInWeeksValue}
                        </span>
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
                          {durationInWeeksArray.map((week) => (
                            <Listbox.Option
                              key={week}
                              className={({ active }) =>
                                clsx(
                                  active
                                    ? "bg-orange-600 text-white"
                                    : "text-zinc-900",
                                  "relative cursor-default select-none py-2 pl-3 pr-9"
                                )
                              }
                              value={week}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={clsx(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      "block truncate"
                                    )}
                                  >
                                    {week}
                                  </span>

                                  {selected ? (
                                    <span
                                      className={clsx(
                                        active
                                          ? "text-white"
                                          : "text-orange-600",
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
                      You can repeat the mesocycle once it's over. If you're
                      unsure what to choose, we recommend 12 weeks.
                    </p>
                  </>
                )}
              </Listbox>

              {durationInWeeks.error ? (
                <p
                  className="mt-2 text-sm text-red-500"
                  id={durationInWeeks.errorId}
                  role="alert"
                >
                  {durationInWeeks.error}
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              <input
                ref={trainingDaysPerWeekRef}
                {...conform.input(trainingDaysPerWeek, { hidden: true })}
                onChange={(e) => setTrainingDaysPerWeekValue(e.target.value)}
                onFocus={() => trainingDaysPerWeekButtonRef.current?.focus()}
              />

              <Listbox
                value={trainingDaysPerWeekValue}
                onChange={(value) =>
                  trainingDaysPerWeekControl.change({ target: { value } })
                }
              >
                {({ open }) => (
                  <>
                    <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
                      How many days per week will you train?
                    </Listbox.Label>

                    <div className="relative mt-2">
                      <Listbox.Button
                        ref={trainingDaysPerWeekButtonRef}
                        className={clsx(
                          "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600",
                          trainingDaysPerWeek.error
                            ? "text-red-300 ring-red-500 focus:ring-red-600"
                            : "focus:ring-orange-600"
                        )}
                      >
                        <span className="block truncate">
                          {trainingDaysPerWeekValue}
                        </span>
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
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {trainingDaysPerWeekArray.map((day) => (
                            <Listbox.Option
                              key={day}
                              className={({ active }) =>
                                clsx(
                                  active
                                    ? "bg-orange-600 text-white"
                                    : "text-zinc-900",
                                  "relative cursor-default select-none py-2 pl-3 pr-9"
                                )
                              }
                              value={day}
                            >
                              {({ selected, active }) => (
                                <>
                                  <span
                                    className={clsx(
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                      "block truncate"
                                    )}
                                  >
                                    {day}
                                  </span>

                                  {selected ? (
                                    <span
                                      className={clsx(
                                        active
                                          ? "text-white"
                                          : "text-orange-600",
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
                      Please select a realistic number that you can commit to.
                      More isn't better, better is better.
                    </p>
                  </>
                )}
              </Listbox>

              {trainingDaysPerWeek.error ? (
                <p
                  className="mt-2 text-sm text-red-500"
                  id={trainingDaysPerWeek.errorId}
                  role="alert"
                >
                  {trainingDaysPerWeek.error}
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              <label
                htmlFor={goal.name}
                className="block text-sm font-medium leading-6 text-zinc-900"
              >
                What is the main goal of the mesocycle?
              </label>
              <div className="mt-2">
                <input
                  className={clsx(
                    "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
                    goal.error
                      ? "text-red-300 ring-red-500 focus:ring-red-600"
                      : "focus:ring-orange-600"
                  )}
                  placeholder="Overall hypertrophy, bringing up legs..."
                  {...conform.input(goal, { type: "text" })}
                />
              </div>
              {goal.error ? (
                <p
                  className="mt-2 text-sm text-red-500"
                  id={goal.errorId}
                  role="alert"
                >
                  {goal.error}
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
          </div>
        </div>
      </Form>
    </div>
  );
}
