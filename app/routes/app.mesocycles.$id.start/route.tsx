import { useForm } from "@conform-to/react";
import { useActionData, useLoaderData } from "@remix-run/react";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import { getMesocycle } from "~/models/mesocycle.server";
import clsx from "clsx";
import { useMemo } from "react";

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

export default function StartMesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData();
  const [form, { deleteExercisesIds: deleteExercisesIdsConfig }] =
    useForm<Schema>({
      id: "delete-exercises",
      lastSubmission,
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <Heading>{mesocycle.name}</Heading>
      <Paragraph>
        On this page you can review your mesocycle to make sure everything looks
        good before starting your training.
      </Paragraph>

      <nav
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl"
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
    </div>
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
        weight: number;
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
    <div className="relative">
      <div
        className={clsx(
          "flex flex-col items-start gap-2 border-y border-b-zinc-200 border-t-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-900",
          index === 0 ? "sm:rounded-tl-xl sm:rounded-tr-xl" : null
        )}
      >
        <h3>
          Training Day {trainingDay.number} - {trainingDay.label}
        </h3>

        <ul className="flex gap-2">
          {muscleGroups.map((muscleGroup) => (
            <li
              key={muscleGroup}
              className="rounded-full bg-orange-500/10 px-3 py-0.5 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20"
            >
              {muscleGroup}
            </li>
          ))}
        </ul>
      </div>
      <ol className="divide-y divide-zinc-100">
        {trainingDay.exercises.map((exercise) => (
          <li key={exercise.id} className="flex w-full gap-x-4 px-4 py-5">
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
              <p className="text-sm font-semibold leading-6 text-zinc-900">
                {exercise.exercise.name}
              </p>
              <p className="mt-1 truncate text-sm leading-5 text-zinc-500">
                {exercise.sets.length} initial sets
              </p>

              <table className="min-w-full divide-y divide-zinc-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-0"
                    >
                      Set
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                    >
                      Weight
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                    >
                      Rep range
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
                    >
                      RIR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {exercise.sets.map((set) => (
                    <tr key={set.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 sm:pl-0">
                        {set.number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                        {set.weight}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                        {set.repRangeLowerBound}-{set.repRangeUpperBound}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
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
    </div>
  );
}
