import { useForm } from "@conform-to/react";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import { getMesocycle, startMesocycle } from "~/models/mesocycle.server";
import clsx from "clsx";
import { Input } from "~/components/input";
import { configRoutes } from "~/config-routes";
import { SubmitButton } from "~/components/submit-button";
import { ChevronUpIcon, PencilSquareIcon } from "@heroicons/react/20/solid";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { AppPageLayout } from "~/components/app-page-layout";
import { Disclosure } from "@headlessui/react";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await getMesocycle(id, user.id, true);
  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  return json({ mesocycle });
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
    return json(submission, { status: 400 });
  }

  const { startDate } = submission.value;
  return startMesocycle(user.id, id, submission, { startDate });
};

export default function StartMesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData();
  const [form, { startDate }] = useForm<Schema>({
    id: "delete-exercises",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <AppPageLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading>{mesocycle.name}</Heading>
          <Paragraph className="mt-1">
            Review your mesocycle to make sure everything looks good before
            starting your training. Keep in mind that the sets, weights and RIR
            (Reps In Reserve) shown here are your starting point and you can
            change them any time during your training.
          </Paragraph>
        </div>

        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to={configRoutes.mesocycles.view(mesocycle.id)}
            className="inline-flex justify-center gap-3 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PencilSquareIcon
              className="h-5 w-5 text-white"
              aria-hidden="true"
            />
            Make changes
          </Link>
        </div>
      </div>

      <nav
        className="mt-6 divide-y divide-zinc-200 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl"
        aria-label="Directory"
      >
        {mesocycle.trainingDays.map((trainingDay, index) => (
          <TrainingDay
            key={trainingDay.id}
            trainingDay={trainingDay}
            index={index}
          />
        ))}
      </nav>

      <Form method="post" className="mt-8" {...form.props}>
        <Input
          config={startDate}
          label="When do you want to start the mesocycle?"
          helperText="This is the date your first microcycle will commence."
          type="date"
        />

        <div className="mt-6">
          <SubmitButton text="Start mesocycle" />
        </div>
      </Form>
    </AppPageLayout>
  );
}

type TrainingDayProps = {
  trainingDay: {
    number: number;
    id: string;
    label: string;
    exercises: {
      number: number;
      id: string;
      notes: string | null;
      exercise: {
        id: string;
        name: string;
        muscleGroups: {
          name: string;
        }[];
      };
      sets: {
        number: number;
        id: string;
        repRangeLowerBound: number;
        repRangeUpperBound: number;
        weight: number | null;
        rir: number;
      }[];
    }[];
  };

  index: number;
};

function TrainingDay({ trainingDay, index }: TrainingDayProps) {
  const getUniqueMuscleGroups = () => {
    const set = new Set<string>();

    trainingDay.exercises.forEach((exercise) => {
      exercise.exercise.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  };

  const muscleGroups = getUniqueMuscleGroups();

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={clsx(
              "flex w-full items-center justify-between gap-2 bg-white px-6 py-4 text-sm font-semibold leading-6 text-zinc-900 hover:bg-orange-50",
              index === 0 ? "sm:rounded-tl-xl sm:rounded-tr-xl" : null
            )}
          >
            <div className="flex flex-col items-start gap-2">
              <h3>
                Training Day {trainingDay.number} - {trainingDay.label}
              </h3>

              <ul className="flex gap-2">
                {muscleGroups.map((muscleGroup, index) => (
                  <li key={muscleGroup}>
                    <MuscleGroupBadge index={index}>
                      {muscleGroup}
                    </MuscleGroupBadge>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <ChevronUpIcon
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-orange-500`}
              />
            </div>
          </Disclosure.Button>

          <Disclosure.Panel>
            <ol className="relative divide-y divide-zinc-100">
              {trainingDay.exercises.map((exercise) => (
                <li key={exercise.id} className="flex w-full gap-x-4 px-6 py-5">
                  <svg
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 485.535 485.535"
                    className="h-7 w-7 text-zinc-600"
                  >
                    <g>
                      <g id="_x35__13_">
                        <g>
                          <path
                            d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
                          />
                          <path
                            d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
                          />
                          <path
                            d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                  <div className="min-w-0 flex-1  ">
                    <p className="flex items-center gap-2 text-sm font-semibold leading-6 text-zinc-900">
                      <span>{exercise.exercise.name}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 px-3 py-0.5 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
                        {exercise.number}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-sm leading-5 text-zinc-500">
                      {exercise.sets.length} sets
                    </p>

                    <table className="mt-2 min-w-full divide-y divide-zinc-300 border-b border-zinc-300">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="py-2 pl-0 pr-3 text-left text-sm font-semibold text-zinc-900"
                          >
                            Set
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-sm font-semibold text-zinc-900"
                          >
                            Weight
                          </th>
                          <th
                            scope="col"
                            className="hidden px-3 py-2 text-left text-sm font-semibold text-zinc-900 xs:table-cell"
                          >
                            Rep range
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-sm font-semibold text-zinc-900"
                          >
                            RIR
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {exercise.sets.map((set) => (
                          <tr key={set.id}>
                            <td className="w-full max-w-0 py-2 pl-0 pr-3 text-sm font-medium text-zinc-900 xs:w-auto xs:max-w-none">
                              {set.number}
                              <dl className="font-normal xs:hidden">
                                <dt className="sr-only">Rep range</dt>
                                <dd className="mt-1 truncate text-zinc-700">
                                  {set.repRangeLowerBound}-
                                  {set.repRangeUpperBound} reps
                                </dd>
                              </dl>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-500">
                              {set.weight}
                            </td>
                            <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-zinc-500 xs:table-cell">
                              {set.repRangeLowerBound}-{set.repRangeUpperBound}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-500">
                              {set.rir}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <p className="mt-4 truncate text-sm leading-5 text-zinc-500">
                      {exercise.notes
                        ? exercise.notes
                        : "No notes for this exercise."}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
