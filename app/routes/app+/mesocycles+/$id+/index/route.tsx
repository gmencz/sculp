import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs, SerializeFrom } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Heading } from "~/components/heading";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import type { MatchWithHeader } from "~/utils/hooks";
import { AppPageLayout } from "~/components/app-page-layout";
import { useMemo } from "react";
import { getUniqueMuscleGroups } from "~/utils/muscle-groups";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { classes } from "~/utils/classes";
import { ArrowLongRightIcon } from "@heroicons/react/20/solid";

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

  const allDays = useMemo(
    () =>
      [...mesocycle.trainingDays, ...mesocycle.restDays].sort((dayA, dayB) => {
        let numberA = typeof dayA === "number" ? dayA : Number(dayA.number);

        let numberB = typeof dayB === "number" ? dayB : Number(dayB.number);

        return numberA - numberB;
      }),
    [mesocycle.restDays, mesocycle.trainingDays]
  );

  return (
    <AppPageLayout>
      <Heading className="hidden text-zinc-900 lg:block">
        {mesocycle.name}
      </Heading>

      <ul className="flex flex-col gap-6 lg:mt-4">
        {allDays.map((day) =>
          typeof day === "number" ? (
            <li key={day}>
              <div className="block rounded-lg bg-zinc-50 px-4 py-4 ring-1 ring-zinc-200 sm:px-6">
                <h3 className="truncate font-semibold text-zinc-900">
                  Day {day} - Rest
                </h3>
              </div>
            </li>
          ) : (
            <li key={day.id}>
              <TrainingDayCard trainingDay={day} />
            </li>
          )
        )}
      </ul>
    </AppPageLayout>
  );
}

type TrainingDayCardProps = {
  trainingDay: SerializeFrom<
    typeof loader
  >["mesocycle"]["trainingDays"][number];
};

function TrainingDayCard({ trainingDay }: TrainingDayCardProps) {
  const muscleGroups = useMemo(
    () => getUniqueMuscleGroups(trainingDay),
    [trainingDay]
  );

  return (
    <Link
      to={`./${trainingDay.id}`}
      className="block divide-y divide-zinc-200 rounded-lg bg-zinc-50 ring-1 ring-zinc-200 transition-all hover:bg-orange-50"
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="truncate font-semibold text-zinc-900">
            {trainingDay.label
              ? `Day ${trainingDay.number} - ${trainingDay.label}`
              : `Day ${trainingDay.number} - Unlabelled`}
          </h3>

          <Link
            to={`./${trainingDay.id}`}
            className={classes.buttonOrLink.textOnly}
          >
            <span className="sr-only">Edit</span>
            <ArrowLongRightIcon className="h-5 w-5" />
          </Link>
        </div>

        {muscleGroups.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {muscleGroups.map((muscleGroup, index) => (
              <li key={muscleGroup}>
                <MuscleGroupBadge index={index}>{muscleGroup}</MuscleGroupBadge>
              </li>
            ))}
          </ul>
        ) : null}

        {trainingDay.exercises.length > 0 ? (
          <ol className="mt-4 flex flex-col gap-1">
            {trainingDay.exercises.map((exercise) => (
              <li key={exercise.id}>
                <p className="text-sm text-zinc-700">
                  {exercise.sets.length} x {exercise.exercise?.name}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </Link>
  );
}
