import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import {
  getDraftMesocycle,
  getDraftMesocycleSessionKey,
  getSession,
  requireUser,
} from "~/session.server";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import type { FieldConfig } from "@conform-to/react";
import { useFieldList, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { configRoutes } from "~/config-routes";
import { Heading } from "~/components/heading";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { SubmitButton } from "~/components/submit-button";
import { ErrorMessage } from "~/components/error-message";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { Listbox, Tab, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useEffect, useMemo, useState } from "react";
import { getRepRangeBounds, useAfterPaintEffect } from "~/utils";
import { toast } from "react-hot-toast";
import { ErrorToast } from "~/components/error-toast";
import { MesocycleOverview } from "~/components/mesocycle-overview";
import { prisma } from "~/db.server";

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

  await prisma.mesocycle.create({
    data: {
      name,
      microcycles: durationInMicrocycles,
      restDays: restDaysPerMicrocycle,
      goal,
      userId: user.id,
      trainingDays: {
        create: trainingDays.map((trainingDay) => ({
          label: trainingDay.label,
          number: trainingDay.dayNumber,
          exercises: {
            create: trainingDay.exercises.map((exercise, index) => ({
              notes: exercise.notes,
              exercise: {
                connect: {
                  id: exercise.id,
                },
              },
              number: index + 1,
              sets: {
                create: exercise.sets.map((set, index) => {
                  const [repRangeLowerBound, repRangeUpperBound] =
                    getRepRangeBounds(set.repRange);

                  return {
                    number: index + 1,
                    weight: set.weight,
                    repRangeLowerBound,
                    repRangeUpperBound,
                    rir: set.rir,
                  };
                }),
              },
            })),
          },
        })),
      },
    },
    select: {
      id: true,
    },
  });

  const session = await getSession(request);
  session.unset(getDraftMesocycleSessionKey(id));
  return redirect(configRoutes.mesocycles.list, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
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

  const exercises = await prisma.exercise.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (mesocycle.presetName) {
    const preset = await prisma.mesocyclePreset.findUnique({
      where: { name: mesocycle.presetName },
      select: {
        trainingDays: {
          orderBy: {
            number: "asc",
          },
          select: {
            number: true,
            label: true,
            exercises: {
              orderBy: {
                number: "asc",
              },
              select: {
                number: true,
                exerciseId: true,
                notes: true,
                sets: {
                  orderBy: {
                    number: "asc",
                  },
                  select: {
                    rir: true,
                    weight: true,
                    repRangeLowerBound: true,
                    repRangeUpperBound: true,
                  },
                },
              },
            },
          },
        },
      },
    });

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
  const lastSubmission = useActionData<typeof action>();
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

  // Find the tab where the first error happened and focus it.
  useEffect(() => {
    if (lastSubmission?.error) {
      const errorKeys = Object.keys(lastSubmission.error);
      if (errorKeys.length) {
        // The error will look something like "trainingDays[0].exercises[0].sets[0].weight"
        // so we are getting the number inside the square brackets which will be the tab index.
        const errorTabIndex = Number(
          errorKeys[0].slice(errorKeys[0].indexOf("]") - 1)[0]
        );

        setSelectedTabIndex(errorTabIndex);
      }
    }
  }, [lastSubmission?.error]);

  useAfterPaintEffect(() => {
    if (lastSubmission?.error && Object.keys(lastSubmission.error).length) {
      toast.custom(
        (t) => (
          <ErrorToast
            t={t}
            title="Error"
            description="There was a problem with your form submission. Please review the days to make sure there are no errors."
          />
        ),
        { duration: 5000, position: "top-center" }
      );
    }
  }, [lastSubmission?.error]);

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

            <MesocycleOverview
              goal={mesocycle.goal}
              microcycles={mesocycle.durationInMicrocycles}
              restDays={mesocycle.restDaysPerMicrocycle.length}
              trainingDays={mesocycle.trainingDaysPerMicrocycle.length}
            />

            {lastSubmission?.error.form ? (
              <div className="mt-5">
                <ErrorMessage>{lastSubmission?.error.form}</ErrorMessage>
              </div>
            ) : null}
          </div>

          <div className="mt-4 sm:ml-auto sm:mt-0">
            <SubmitButton
              className="w-full whitespace-nowrap"
              text="Save and continue"
            />
          </div>
        </div>

        {/* Days tabs */}
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
                    unmount={false}
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
