import { JointPain } from "@prisma/client";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { configRoutes } from "~/config-routes";
import { getExercises } from "~/models/exercise.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const exercises = await getExercises(user.id);
  return json({ exercises });
};

export default function Exercises() {
  const { exercises } = useLoaderData<typeof loader>();

  return (
    <div className="py-10">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading>Exercises</Heading>
          <Paragraph>A list of all your exercises.</Paragraph>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to={configRoutes.newExercise}
            className="block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            New exercise
          </Link>
        </div>
      </div>

      <div className="-mx-4 mt-6 sm:-mx-0">
        <table className="min-w-full divide-y divide-zinc-300">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-0"
              >
                Name
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 lg:table-cell"
              >
                Muscles
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900"
              >
                Pain
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-zinc-50">
            {exercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ExerciseRowProps = {
  exercise: {
    id: string;
    name: string;
    jointPain: JointPain;
    muscleGroups: {
      id: string;
      name: string;
    }[];
  };
};

const jointPainText = {
  [JointPain.NONE]: "None",
  [JointPain.LOW]: "Low",
  [JointPain.MODERATE]: "Moderate",
  [JointPain.HIGH]: "High",
};

function ExerciseRow({ exercise }: ExerciseRowProps) {
  const formattedMuscleGroups = exercise.muscleGroups
    .map((m) => m.name)
    .join(", ");

  return (
    <tr>
      <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 sm:w-auto sm:max-w-none sm:pl-0">
        {exercise.name}
        <dl className="font-normal lg:hidden">
          <dt className="sr-only">Muscles</dt>
          <dd className="mt-1 truncate text-zinc-700">
            {formattedMuscleGroups}
          </dd>
        </dl>
      </td>
      <td className="hidden px-3 py-4 text-sm text-zinc-500 lg:table-cell">
        {formattedMuscleGroups}
      </td>
      <td className="px-3 py-4 text-sm text-zinc-500">
        {jointPainText[exercise.jointPain]}
      </td>

      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
        <Link
          to={`./${exercise.id}`}
          className="text-orange-600 hover:text-orange-900"
        >
          Edit<span className="sr-only">, {exercise.name}</span>
        </Link>
      </td>
    </tr>
  );
}
