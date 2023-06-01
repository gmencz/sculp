import type { FieldConfig } from "@conform-to/react";
import { useFieldList, useForm } from "@conform-to/react";
import {
  Form,
  Link,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { ErrorPage } from "~/components/error-page";
import { requireUser } from "~/session.server";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import {
  ArrowLongLeftIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/20/solid";
import { ErrorMessage } from "~/components/error-message";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { getMesocycle, updateMesocycle } from "~/models/mesocycle.server";
import { BackLink } from "~/components/back-link";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { toast } from "react-hot-toast";
import { SuccessToast } from "~/components/success-toast";
import { useAfterPaintEffect } from "~/utils";
import { getExercisesForAutocomplete } from "~/models/exercise.server";
import { configRoutes } from "~/config-routes";
import { MesocycleOverview } from "~/components/mesocycle-overview";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ErrorToast } from "~/components/error-toast";
import { Listbox, Tab, Transition } from "@headlessui/react";
import clsx from "clsx";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await getMesocycle(id, user.id);
  if (!mesocycle) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const exercises = await getExercisesForAutocomplete(user.id);

  return json({ mesocycle, exercises });
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorPage
        statusCode={error.status}
        title="Mesocycle not found"
        subtitle={`We couldn't find the mesocycle you were looking for. So sorry.`}
        action={<BackLink to="/app">Back to your mesocycles</BackLink>}
      />
    );
  }

  throw error;
}

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

  const { trainingDays } = submission.value;
  return updateMesocycle(new URL(request.url), id, user.id, { trainingDays });
};

export default function Mesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const lastSubmission = useActionData<typeof action>();
  const [form, { trainingDays }] = useForm<Schema>({
    id: "edit-mesocycle",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      trainingDays: mesocycle.trainingDays.map((trainingDay) => ({
        id: trainingDay.id,
        label: trainingDay.label,
        dayNumber: trainingDay.number.toString(),
        exercises: trainingDay.exercises.map((exercise) => ({
          id: exercise.id,
          searchedExerciseId: exercise.exercise.id,
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
  const successId = searchParams.get("success_id");
  useAfterPaintEffect(() => {
    if (successId) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success"
            description="Your changes have been saved."
          />
        ),
        { duration: 3000, position: "top-center", id: successId }
      );
    }
  }, [successId]);

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
    if (lastSubmission?.error) {
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
      className="flex min-h-full flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      {...form.props}
    >
      <div className="mb-4 sm:hidden">
        <BackLink to={configRoutes.mesocycles.list}>Go back</BackLink>
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
