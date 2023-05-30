import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/20/solid";
import type { FieldConfig } from "@conform-to/react";
import { useFieldList, useForm } from "@conform-to/react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { parse } from "@conform-to/zod";
import {
  createMesocycle,
  getDraftMesocycle,
  getMesocyclePresetByName,
} from "~/models/mesocycle.server";
import { configRoutes } from "~/config-routes";
import { Heading } from "~/components/heading";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { SubmitButton } from "~/components/submit-button";
import { ErrorMessage } from "~/components/error-message";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { getExercisesForAutocomplete } from "~/models/exercise.server";
import { Listbox, Tab, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useMemo, useState } from "react";

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });
  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const draftMesocycle = await getDraftMesocycle(request, id);
  if (!draftMesocycle) {
    return redirect(configRoutes.mesocycles.newStepOne);
  }

  const { name, goal, durationInMicrocycles, restDaysPerMicrocycle } =
    draftMesocycle;
  const { trainingDays } = submission.value;

  return createMesocycle(request, user.id, {
    draftId: id,
    goal,
    name,
    trainingDays,
    microcycles: durationInMicrocycles,
    restDays: restDaysPerMicrocycle,
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await getDraftMesocycle(request, id);
  if (!mesocycle) {
    return redirect(configRoutes.mesocycles.newStepOne);
  }

  const exercises = await getExercisesForAutocomplete(user.id);

  if (mesocycle.presetName) {
    const preset = await getMesocyclePresetByName(mesocycle.presetName);
    if (!preset) {
      throw new Error(
        `Preset not found with name ${mesocycle.presetName}. This shouldn't happen`
      );
    }

    return json({ mesocycle, preset, exercises });
  }

  return json({ mesocycle, preset: null, exercises });
};

export default function NewMesocycleDesign() {
  const { mesocycle, preset } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData();
  const [form, { trainingDays }] = useForm<Schema>({
    id: "save-mesocycle",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      trainingDays: preset
        ? preset.trainingDays.map((trainingDay) => ({
            dayNumber: trainingDay.number.toString(),
            label: trainingDay.label,
            exercises: trainingDay.exercises.map((exercise) => ({
              id: exercise.exerciseId,
              dayNumber: trainingDay.number.toString(),
              notes: exercise.notes ?? undefined,
              sets: exercise.sets.map((set) => ({
                repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
                rir: set.rir.toString(),
                weight: set.weight?.toString(),
              })),
            })),
          }))
        : mesocycle.trainingDaysPerMicrocycle.map((dayNumber) => ({
            dayNumber: dayNumber.toString(),
            exercises: [],
          })),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  const allDays = useMemo(
    () =>
      [...trainingDaysList, ...mesocycle.restDaysPerMicrocycle].sort(
        (dayA, dayB) => {
          let numberA =
            typeof dayA === "number"
              ? dayA
              : Number(dayA.defaultValue?.dayNumber);
          let numberB =
            typeof dayB === "number"
              ? dayB
              : Number(dayB.defaultValue?.dayNumber);
          return numberA - numberB;
        }
      ),
    [mesocycle.restDaysPerMicrocycle, trainingDaysList]
  );

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  return (
    <Form
      method="post"
      {...form.props}
      className="flex min-h-full flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex min-w-0 flex-col sm:flex-row">
          <div>
            <Heading>{mesocycle.name}</Heading>

            <div className="mt-1 flex flex-col gap-1">
              <div className="mt-2 flex items-center text-sm text-zinc-500">
                <CalendarDaysIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
                  aria-hidden="true"
                />
                {mesocycle.durationInMicrocycles}{" "}
                {mesocycle.durationInMicrocycles === 1
                  ? "microcycle"
                  : "microcycles"}
              </div>
              <div className="mt-2 flex items-center text-sm text-zinc-500">
                <CalendarIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
                  aria-hidden="true"
                />
                {mesocycle.trainingDaysPerMicrocycle.length} training{" "}
                {mesocycle.trainingDaysPerMicrocycle.length === 1
                  ? "day"
                  : "days"}{" "}
                per microcycle
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
                {mesocycle.goal}
              </div>
            </div>

            {lastSubmission?.error.form ? (
              <div className="mt-5">
                <ErrorMessage>{lastSubmission?.error.form}</ErrorMessage>
              </div>
            ) : null}
          </div>

          <div className="mt-4 sm:ml-auto sm:mt-0">
            <SubmitButton
              className="whitespace-nowrap"
              text="Save and continue"
            />
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="mt-4">
          <div className="block sm:hidden">
            <SmTabsSelect
              allDays={allDays}
              selectedTabIndex={selectedTabIndex}
              setSelectedTabIndex={setSelectedTabIndex}
            />
          </div>

          <Tab.Group
            selectedIndex={selectedTabIndex}
            onChange={setSelectedTabIndex}
          >
            <Tab.List className="hidden gap-8 border-b border-zinc-200 sm:flex">
              {allDays.map((day) =>
                typeof day === "number" ? (
                  <Tab
                    key={`desktop-tab-${day}`}
                    className={({ selected }) =>
                      clsx(
                        selected
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-zinc-500 hover:border-zinc-200 hover:text-zinc-700",

                        "flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
                      )
                    }
                  >
                    <span className="hidden lg:inline">Day {day}</span>
                    <span className="lg:hidden">D{day}</span>
                  </Tab>
                ) : (
                  <Tab
                    key={`desktop-tab-${day.defaultValue?.dayNumber}`}
                    className={({ selected }) =>
                      clsx(
                        selected
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-zinc-500 hover:border-zinc-200 hover:text-zinc-700",

                        "flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
                      )
                    }
                  >
                    <span className="hidden lg:inline">
                      Day {day.defaultValue?.dayNumber}
                    </span>
                    <span className="lg:hidden">
                      D{day.defaultValue?.dayNumber}
                    </span>
                  </Tab>
                )
              )}
            </Tab.List>

            <Tab.Panels className="mt-4 pb-8 lg:pb-0">
              {allDays.map((day) =>
                typeof day === "number" ? (
                  <Tab.Panel
                    key={`desktop-tab-panel-n${day}`}
                    className="rounded border border-zinc-200 bg-white"
                  >
                    <div className="px-4 py-5 sm:px-6">
                      <p className="text-base font-semibold leading-6 text-zinc-900">
                        Day {day} - Rest
                      </p>
                    </div>
                  </Tab.Panel>
                ) : (
                  <Tab.Panel
                    key={`desktop-tab-panel-${day.key}`}
                    className="rounded border border-zinc-200 bg-white"
                  >
                    <TrainingDayFieldset
                      formRef={form.ref}
                      dayNumber={Number(day.defaultValue?.dayNumber)}
                      config={day}
                    />
                  </Tab.Panel>
                )
              )}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Form>
  );
}

type SmTabsSelectProps = {
  selectedTabIndex: number;
  setSelectedTabIndex: React.Dispatch<React.SetStateAction<number>>;
  allDays: (
    | number
    | ({
        key: string;
      } & FieldConfig<{
        label: string;
        dayNumber: number;
        exercises: {
          sets: {
            rir: number;
            repRange: string;
            weight?: number | undefined;
          }[];
          id: string;
          dayNumber: number;
          notes?: string | undefined;
        }[];
      }>)
  )[];
};

function SmTabsSelect({
  selectedTabIndex,
  setSelectedTabIndex,
  allDays,
}: SmTabsSelectProps) {
  const selectedDay = allDays[selectedTabIndex];

  return (
    <Listbox value={selectedTabIndex} onChange={setSelectedTabIndex}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
            Viewing day
          </Listbox.Label>
          <div className="relative mt-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm sm:leading-6">
              <span className="block truncate">
                {typeof selectedDay === "number"
                  ? selectedDay
                  : selectedDay.defaultValue?.dayNumber}
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
                {allDays.map((day, index) => (
                  <Listbox.Option
                    key={
                      typeof day === "number"
                        ? day.toString()
                        : day.defaultValue?.dayNumber
                    }
                    className={({ active }) =>
                      clsx(
                        active ? "bg-orange-600 text-white" : "text-zinc-900",
                        "relative cursor-default select-none py-2 pl-3 pr-9"
                      )
                    }
                    value={index}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={clsx(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {typeof day === "number"
                            ? day.toString()
                            : day.defaultValue?.dayNumber}
                        </span>

                        {selected ? (
                          <span
                            className={clsx(
                              active ? "text-white" : "text-orange-600",
                              "absolute inset-y-0 right-0 flex items-center pr-4"
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
