import type { FieldConfig } from "@conform-to/react";
import { useFieldList, useForm } from "@conform-to/react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { ErrorMessage } from "~/components/error-message";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { BackLink } from "~/components/back-link";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { configRoutes } from "~/utils/routes";
import { MesocycleOverview } from "~/components/mesocycle-overview";
import { Fragment, useMemo, useState } from "react";
import { Listbox, Tab, Transition } from "@headlessui/react";
import clsx from "clsx";
import { prisma } from "~/utils/db.server";
import { getRepRangeBounds } from "~/utils/rep-ranges";
import { requireUser } from "~/services/auth/api/require-user";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await prisma.mesocycle.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      goal: true,
      microcycles: true,
      restDays: true,
      trainingDays: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          label: true,
          exercises: {
            orderBy: { number: "asc" },
            select: {
              id: true,
              exercise: {
                select: {
                  id: true,
                  name: true,
                },
              },
              number: true,
              notes: true,
              sets: {
                orderBy: { number: "asc" },
                select: {
                  id: true,
                  number: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                  weight: true,
                  rir: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mesocycle) {
    throw new Response("Not Found", {
      status: 404,
    });
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

  return json({ mesocycle, exercises });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });
  if (!submission.value || submission.intent !== "submit") {
    const errorKeys = Object.keys(submission.error);
    if (errorKeys.length > 0) {
      // The error key will look something like "trainingDays[0].exercises[0].sets[0].weight"
      // so we are getting the number inside the square brackets which will be the tab index.
      const errorTabIndex = Number(
        errorKeys[0].slice(errorKeys[0].indexOf("]") - 1)[0]
      );

      if (!Number.isNaN(errorTabIndex)) {
        const updatedSession = await flashGlobalNotification(request, {
          type: "error",
          message: "There's some errors in the mesocycle.",
        });

        return json(
          { ...submission, selectedTab: errorTabIndex },
          {
            status: 400,
            headers: {
              "Set-Cookie": await commitSession(updatedSession),
            },
          }
        );
      }
    }

    return json({ ...submission, selectedTab: null }, { status: 400 });
  }

  const { trainingDays } = submission.value;

  const mesocycle = await prisma.mesocycle.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  // Check if the mesocycle exists and belongs to the current user.
  if (!mesocycle || mesocycle.userId !== user.id) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const updatedMesocycle = await prisma.mesocycle.update({
    where: {
      id,
    },
    select: {
      id: true,
    },
    data: {
      trainingDays: {
        update: trainingDays.map((trainingDay) => ({
          where: { id: trainingDay.id },
          data: {
            label: { set: trainingDay.label },
            exercises: {
              deleteMany: { mesocycleTrainingDayId: trainingDay.id },

              create: trainingDay.exercises.map((exercise, index) => ({
                notes: exercise.notes,
                exercise: {
                  connect: {
                    id: exercise.searchedExerciseId,
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
          },
        })),
      },
    },
  });

  const updatedSession = await flashGlobalNotification(request, {
    type: "success",
    message: "The mesocycle has been updated.",
  });

  return redirect(configRoutes.app.mesocycles.view(updatedMesocycle.id), {
    headers: {
      "Set-Cookie": await commitSession(updatedSession),
    },
  });
};

export default function Mesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, { trainingDays }] = useForm<Schema>({
    id: "edit-mesocycle",
    lastSubmission,
    noValidate: true,
    shouldRevalidate: "onSubmit",
    defaultValue: {
      trainingDays: mesocycle.trainingDays.map((trainingDay) => ({
        id: trainingDay.id,
        label: trainingDay.label,
        dayNumber: trainingDay.number.toString(),
        exercises: trainingDay.exercises.map((exercise) => ({
          id: exercise.id,
          searchedExerciseId: exercise.exercise?.id,
          notes: exercise.notes ?? undefined,
          sets: exercise.sets.map((set) => ({
            id: set.id,
            repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
            weight: set.weight?.toString(),
            rir: set.rir.toString(),
          })),
        })),
      })),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  const allDays = useMemo(
    () =>
      [...trainingDaysList, ...mesocycle.restDays].sort((dayA, dayB) => {
        let numberA =
          typeof dayA === "number"
            ? dayA
            : Number(dayA.defaultValue?.dayNumber);
        let numberB =
          typeof dayB === "number"
            ? dayB
            : Number(dayB.defaultValue?.dayNumber);
        return numberA - numberB;
      }),
    [mesocycle.restDays, trainingDaysList]
  );

  const [selectedTabIndex, setSelectedTabIndex] = useState(
    lastSubmission?.selectedTab || 0
  );

  return (
    <Form
      method="post"
      className="flex min-h-full flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      {...form.props}
    >
      <div className="mb-4 sm:hidden">
        <BackLink to={configRoutes.app.mesocycles.list}>Go back</BackLink>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-0">
          <div>
            <Heading>{mesocycle.name}</Heading>

            <MesocycleOverview
              goal={mesocycle.goal}
              microcycles={mesocycle.microcycles}
              restDays={mesocycle.restDays.length}
              trainingDays={mesocycle.trainingDays.length}
            />

            {lastSubmission?.error.form ? (
              <div className="mt-5">
                <ErrorMessage>{lastSubmission?.error.form}</ErrorMessage>
              </div>
            ) : null}
          </div>

          <div className="mt-1 sm:ml-auto sm:mt-0">
            <SubmitButton
              className="w-full whitespace-nowrap"
              text="Save changes"
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
        id: string;
        label: string;
        exercises: {
          id: string | null;
          sets: {
            id: string | null;
            weight: number;
            rir: number;
            repRange: string;
          }[];
          searchedExerciseId: string;
          notes?: string | undefined;
        }[];
        dayNumber: number;
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
