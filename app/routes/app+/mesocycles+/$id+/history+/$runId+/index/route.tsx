import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs, SerializeFrom } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import type { LegendProps } from "recharts";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
          weightUnitPreference: true,
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

const renderLegend = (props: LegendProps) => {
  const { payload } = props;

  return (
    <ul className="mt-10 flex flex-wrap items-center justify-center gap-6">
      {payload?.map((entry, index) => (
        <li
          key={`item-${index}`}
          className="text-sm font-semibold"
          style={{ color: entry.color }}
        >
          {entry.value}
        </li>
      ))}
    </ul>
  );
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
      stat: `${mesocycleRun.totalVolume} ${
        mesocycleRun.mesocycle.weightUnitPreference === "KILOGRAM"
          ? "kg"
          : "lbs"
      }`,
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

      <div className="mt-12">
        <h3 className="text-base font-semibold leading-6 text-zinc-900">
          Exercises volume graph
        </h3>

        <Paragraph className="mt-1">
          The graph showcases the total volume throughout the mesocycle run for
          all exercises, each exercise is represented by a distinct line.
        </Paragraph>

        {mesocycleRun.chartData.length > 0 ? (
          <ResponsiveContainer className="mt-6" width="100%" height={400}>
            <LineChart data={mesocycleRun.chartData}>
              <CartesianGrid strokeDasharray="3 3" fill="#fafafa" />

              {mesocycleRun.chartExercises.map((exercise) => (
                <Line
                  key={exercise.name}
                  type="monotone"
                  dataKey={exercise.name}
                  stroke={exercise.color}
                />
              ))}

              {/* @ts-ignore because the type is fine */}
              <Legend content={(props) => renderLegend(props)} />

              <YAxis
                dx={-20}
                tickLine={{ stroke: "#f97316" }}
                axisLine={{ stroke: "#e4e4e7" }}
                tick={{ fill: "#71717a", fontSize: "0.875rem" }}
              />
              <XAxis
                dataKey="formattedShortDate"
                dy={10}
                tickLine={{ stroke: "#f97316" }}
                axisLine={{ stroke: "#e4e4e7" }}
                tick={{ fill: "#71717a", fontSize: "0.875rem" }}
              />
              <Tooltip
                separator=": "
                labelClassName="text-zinc-500"
                wrapperClassName="text-sm font-medium rounded-xl shadow-lg bg-white ring-1 ring-zinc-900/5 flex flex-col gap-1"
                contentStyle={{ border: "none" }}
                itemStyle={{
                  margin: 0,
                  padding: 0,
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji","Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji"',
                }}
                formatter={(value, name, item) => {
                  return [value, `${name} volume`];
                }}
                labelFormatter={(label, item) => {
                  if (!item[0]) return label;
                  return item[0].payload.formattedDate;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Paragraph className="mt-2">No data</Paragraph>
        )}
      </div>

      <div className="mt-8 flex items-center border-t border-zinc-200 pt-6 dark:border-zinc-700 sm:justify-start">
        <Link to="./training" className={classes.buttonOrLink.primary}>
          <span>View training</span>
        </Link>
      </div>
    </AppPageLayout>
  );
}
