import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs, SerializeFrom } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Heading } from "~/components/heading";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import type { MatchWithHeader } from "~/utils/hooks";
import { AppPageLayout } from "~/components/app-page-layout";
import { useMemo } from "react";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => data.mesocycle.name,
  links: [],
};

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
                  name: true,
                  muscleGroups: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              sets: {
                orderBy: { number: "asc" },
                select: {
                  id: true,
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

  return json({ mesocycle });
};

export default function Mesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();

  return (
    <AppPageLayout>
      <Heading className="hidden lg:block">{mesocycle.name}</Heading>

      <ul className="flex flex-col gap-6 lg:mt-4">
        {mesocycle.trainingDays.map((trainingDay) => (
          <li key={trainingDay.id}>
            <TrainingDayCard data={trainingDay} />
          </li>
        ))}
      </ul>
    </AppPageLayout>
  );
}

type TrainingDayCardProps = {
  data: SerializeFrom<typeof loader>["mesocycle"]["trainingDays"][number];
};

function TrainingDayCard({ data }: TrainingDayCardProps) {
  const muscleGroups = useMemo(() => {
    const set = new Set<string>();

    data.exercises.forEach((exercise) => {
      exercise.exercise?.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  }, [data]);

  return (
    <Link
      to={`./${data.id}`}
      className="block divide-y divide-zinc-200 rounded-lg bg-zinc-50 ring-1 ring-zinc-200 transition-all hover:bg-orange-50"
    >
      <div className="px-4 py-4 sm:px-6">
        <h3 className="truncate font-semibold text-zinc-900">
          Day {data.number} - {data.label}
        </h3>

        <ul className="mt-2 flex flex-wrap gap-2">
          {muscleGroups.map((muscleGroup, index) => (
            <li key={muscleGroup}>
              <MuscleGroupBadge index={index}>{muscleGroup}</MuscleGroupBadge>
            </li>
          ))}
        </ul>

        <ol className="mt-4 flex flex-col gap-1">
          {data.exercises.map((exercise) => (
            <li key={exercise.id}>
              <p className="text-sm text-zinc-700">
                {exercise.sets.length} x {exercise.exercise!.name}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Link>
  );
}
