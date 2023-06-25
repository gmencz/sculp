import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs, SerializeFrom } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import { AppPageLayout } from "~/components/app-page-layout";
import { Paragraph } from "~/components/paragraph";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import type { MatchWithHeader } from "~/utils/hooks";
import { chartColors } from "./chart-colors";
import { Heading } from "~/components/heading";
import { classes } from "~/utils/classes";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => data.mesocycleRun.mesocycle.name,
  links: [],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { runId } = params;
  if (!runId) {
    throw new Error("runId param is falsy, this should never happen");
  }

  const mesocycleRun = await prisma.mesocycleRun.findFirst({
    where: {
      id: runId,
      ranByUserId: user.id,
    },
    select: {
      mesocycle: {
        select: {
          name: true,
        },
      },
      startDate: true,
      microcycles: {
        select: {
          trainingDays: {
            where: {
              completed: true,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!mesocycleRun) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const [completedSets, completedExercises] = await Promise.all([
    prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.findMany({
      where: {
        exercise: {
          trainingDay: {
            microcycle: {
              mesocycleRunId: runId,
            },
            completed: true,
          },
        },
        completed: true,
      },
      select: {
        weight: true,
        repsCompleted: true,
      },
    }),
    prisma.mesocycleRunMicrocycleTrainingDayExercise.findMany({
      where: {
        trainingDay: {
          microcycle: {
            mesocycleRunId: runId,
          },
          completed: true,
        },
      },
      select: {
        trainingDay: {
          select: {
            date: true,
          },
        },
        exercise: {
          select: {
            name: true,
          },
        },
        sets: {
          select: {
            weight: true,
            repsCompleted: true,
          },
        },
      },
    }),
  ]);

  const completedTrainingDays = mesocycleRun.microcycles.reduce(
    (acc, curr) => acc + curr.trainingDays.length,
    0
  );

  const totals = completedSets.reduce(
    (acc, curr) => {
      return {
        volume: acc.volume + (curr.weight || 0) * (curr.repsCompleted || 0),
        reps: acc.reps + (curr.repsCompleted || 0),
      };
    },
    {
      volume: 0,
      reps: 0,
    }
  );

  const chartData = completedExercises.map((completedExercise) => {
    return {
      [completedExercise.exercise!.name]: completedExercise.sets.reduce(
        (acc, curr) => acc + (curr.weight || 0) * (curr.repsCompleted || 0),
        0
      ),
      formattedShortDate: format(
        new Date(completedExercise.trainingDay!.date),
        "d'.'M'.'yy"
      ),
      formattedDate: format(
        new Date(completedExercise.trainingDay!.date),
        "MMMM' 'd' 'yyyy"
      ),
    };
  });

  const chartExercisesNamesSet = new Set<string>();
  completedExercises.forEach((completedExercise) => {
    chartExercisesNamesSet.add(completedExercise.exercise!.name);
  });

  const chartExercises = Array.from(chartExercisesNamesSet).map((name) => ({
    name,
    color: chartColors[Math.floor(Math.random() * chartColors.length)],
  }));

  return json({
    mesocycleRun: {
      ...mesocycleRun,
      completedTrainingDays,
      totalVolume: totals.volume,
      totalReps: totals.reps,
      totalSets: completedSets.length,
      chartData,
      chartExercises,
    },
  });
};

export default function MesocycleRun() {
  const { mesocycleRun } = useLoaderData<typeof loader>();

  const stats = [
    {
      name: "Completed training days",
      stat: mesocycleRun.completedTrainingDays,
    },
    {
      name: "Total volume",
      stat: mesocycleRun.totalVolume,
    },
    {
      name: "Total sets",
      stat: mesocycleRun.totalSets,
    },
    {
      name: "Total reps",
      stat: mesocycleRun.totalReps,
    },
  ];

  return (
    <AppPageLayout>
      <Heading className="hidden text-zinc-900 dark:text-zinc-50 lg:block">
        {mesocycleRun.mesocycle.name}
      </Heading>

      <Paragraph className="lg:mt-1">
        This mesocycle run was started on{" "}
        <strong>
          {format(new Date(mesocycleRun.startDate), "MMMM' 'd' 'yyyy")}
        </strong>
        .
      </Paragraph>

      <h3 className="mt-4 text-base font-semibold leading-6 text-zinc-900 dark:text-zinc-50">
        Stats
      </h3>
      <dl className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden">
            <dt className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {item.name}
            </dt>
            <dd className="mt-2 flex items-baseline text-3xl font-semibold text-zinc-900">
              <span className="tracking-tight text-orange-500">
                {item.stat}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex items-center border-t border-zinc-200 pt-6 dark:border-zinc-700 sm:justify-start">
        <Link to="./training" className={classes.buttonOrLink.primary}>
          <span>View training</span>
        </Link>
      </div>
    </AppPageLayout>
  );
}
