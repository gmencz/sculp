import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/server-runtime";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { Fragment, useState } from "react";
import { AppPageHeader } from "~/components/app-page-header";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { Tab } from "@headlessui/react";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { ExercisePerformance } from "./exercise-performance";
import { ExerciseOptionsModal } from "./exercise-options-modal";
import { DeleteExerciseModal } from "./delete-exercise-modal";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request, {
    select: { weightUnitPreference: true },
  });

  const exercise = await prisma.exercise.findFirst({
    where: {
      AND: [
        { id: params.id },
        {
          OR: [{ userId: user.id }, { shared: true }],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      shared: true,
      primaryMuscleGroups: { select: { name: true } },
      otherMuscleGroups: { select: { name: true } },
    },
  });

  if (!exercise) {
    throw new Response("Not Found", { status: 404 });
  }

  const performances = await prisma.trainingSessionExercise.findMany({
    where: {
      exerciseId: exercise.id,
    },
    select: {
      id: true,
      notes: true,
      sets: {
        orderBy: {
          weight: "desc",
        },
        select: {
          id: true,
          number: true,
          reps: true,
          rir: true,
          type: true,
          weight: true,
        },
      },
      trainingSession: {
        select: {
          id: true,
          name: true,
          startedAt: true,
        },
      },
    },
    orderBy: {
      trainingSession: {
        startedAt: "asc",
      },
    },
  });

  const stats = performances.map((performance) => {
    const oneRepMaxes = performance.sets.map((set) => {
      // Using the Brzycki equation
      const weightInLbs =
        user.weightUnitPreference === "LBS" ? set.weight : set.weight * 2.20462;

      return weightInLbs / (1.0278 - 0.0278 * set.reps);
    });

    const heaviestWeight = Math.max(
      ...performance.sets.map((set) => set.weight)
    );

    const heaviestOneRepMax = Math.max(...oneRepMaxes);

    return {
      date: performance.trainingSession!.startedAt,
      heaviestWeight,
      heaviestOneRepMax:
        user.weightUnitPreference === "LBS"
          ? heaviestOneRepMax
          : heaviestOneRepMax * 0.453592,
    };
  });

  return json({
    exercise,
    stats,
    performances,
    weightUnitPreference: user.weightUnitPreference,
  });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  if (request.method === "DELETE") {
    await prisma.exercise.deleteMany({
      where: {
        AND: [{ userId: user.id }, { id: params.id }, { shared: false }],
      },
    });

    const session = await flashGlobalNotification(request, {
      message: "Exercise successfully deleted!",
      type: "success",
    });

    return redirect(configRoutes.app.exercises, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  throw new Response("Invalid Request", { status: 400 });
};

enum ActivePayloadType {
  HEAVIEST_WEIGHT = "HEAVIEST_WEIGHT",
  HEAVIEST_ONE_REP_MAX = "HEAVIEST_ONE_REP_MAX",
}

export default function Exercise() {
  const { exercise, stats, weightUnitPreference, performances } =
    useLoaderData<typeof loader>();

  const [showExerciseOptionsModal, setShowExerciseOptionsModal] =
    useState(false);

  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false);

  const [activePayload, setActivePayload] = useState({
    ...stats[0],
    index: 0,
    type: ActivePayloadType.HEAVIEST_WEIGHT,
  });

  return (
    <>
      <AppPageHeader
        goBackTo={configRoutes.app.exercises}
        pageTitle={exercise.name}
        navigationItems={
          exercise.shared
            ? []
            : [
                {
                  name: "Exercise options",
                  element: (
                    <>
                      <button
                        className="-m-2 p-2 text-zinc-950 hover:text-zinc-900 dark:text-white dark:hover:text-zinc-50"
                        onClick={() => {
                          setShowExerciseOptionsModal(true);
                        }}
                      >
                        <EllipsisVerticalIcon className="h-6 w-6" />
                        <span className="sr-only">Exercise options</span>
                      </button>
                    </>
                  ),
                },
              ]
        }
      />

      <AppPageLayout>
        <Card>
          <div className="flex flex-col gap-1">
            <p className="text-zinc-700 dark:text-zinc-300">
              Primary:{" "}
              <span>
                {" "}
                {exercise.primaryMuscleGroups
                  .map((muscleGroup) => muscleGroup.name)
                  .join(", ")}
              </span>
            </p>

            {exercise.otherMuscleGroups.length ? (
              <p className="text-zinc-700 dark:text-zinc-300">
                Other:{" "}
                <span>
                  {" "}
                  {exercise.otherMuscleGroups
                    .map((muscleGroup) => muscleGroup.name)
                    .join(", ")}
                </span>
              </p>
            ) : null}
          </div>

          <div className={clsx(classes.buttonOrLink.secondary, "mt-3")}>
            {exercise.shared ? "Shared" : "Custom"}
          </div>

          {stats.length > 0 ? (
            <>
              <div className="mb-4 mt-4">
                <span className="mr-2 font-semibold lowercase">
                  {activePayload.type === ActivePayloadType.HEAVIEST_WEIGHT
                    ? `${
                        Math.round(activePayload.heaviestWeight * 100) / 100
                      } ${weightUnitPreference}`
                    : `${
                        Math.round(activePayload.heaviestOneRepMax * 100) / 100
                      } ${weightUnitPreference}`}
                </span>

                <span className="text-orange-500">
                  {format(new Date(activePayload.date), "MMMM' 'd', 'yyyy")}
                </span>
              </div>

              <Tab.Group
                onChange={(index) => {
                  if (index === 0) {
                    setActivePayload((activePayload) => ({
                      ...stats[0],
                      ...activePayload,
                      type: ActivePayloadType.HEAVIEST_WEIGHT,
                    }));
                  } else if (index === 1) {
                    setActivePayload((activePayload) => ({
                      ...stats[0],
                      ...activePayload,
                      type: ActivePayloadType.HEAVIEST_ONE_REP_MAX,
                    }));
                  }
                }}
              >
                <Tab.Panels>
                  <Tab.Panel>
                    {/* Heaviest weight tab */}
                    <ResponsiveContainer
                      className="-ml-3"
                      width="100%"
                      height={200}
                    >
                      <LineChart
                        onClick={(e) => {
                          if (e?.activePayload) {
                            setActivePayload({
                              ...e.activePayload[0].payload,
                              type: ActivePayloadType.HEAVIEST_WEIGHT,
                              index: e.activeTooltipIndex,
                            });
                          }
                        }}
                        data={stats}
                      >
                        <CartesianGrid stroke="#71717a" />
                        <Line
                          type="monotone"
                          dataKey="heaviestWeight"
                          stroke="#f97316"
                          isAnimationActive={false}
                        />
                        <YAxis
                          dx={-15}
                          tickLine={{ stroke: "#f97316" }}
                          axisLine={{ stroke: "#71717a" }}
                          tick={{ fill: "#71717a", fontSize: "0.875rem" }}
                        />
                        <XAxis
                          dataKey="date"
                          dy={10}
                          tickFormatter={(value) => {
                            return format(new Date(value), "MMM' 'd");
                          }}
                          tickLine={{ stroke: "#f97316" }}
                          axisLine={{ stroke: "#71717a" }}
                          tick={{ fill: "#71717a", fontSize: "0.875rem" }}
                        />
                        <ReferenceLine
                          x={activePayload.date}
                          stroke="#f97316"
                          label={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Tab.Panel>

                  <Tab.Panel>
                    {/* One rep max tab */}
                    <ResponsiveContainer
                      className="-ml-3"
                      width="100%"
                      height={200}
                    >
                      <LineChart
                        onClick={(e) => {
                          if (e?.activePayload) {
                            setActivePayload({
                              ...e.activePayload[0].payload,
                              type: ActivePayloadType.HEAVIEST_ONE_REP_MAX,
                              index: e.activeTooltipIndex,
                            });
                          }
                        }}
                        data={stats}
                      >
                        <CartesianGrid stroke="#71717a" />
                        <Line
                          type="monotone"
                          dataKey="heaviestOneRepMax"
                          stroke="#f97316"
                          isAnimationActive={false}
                        />
                        <YAxis
                          dx={-15}
                          tickLine={{ stroke: "#f97316" }}
                          axisLine={{ stroke: "#71717a" }}
                          tick={{ fill: "#71717a", fontSize: "0.875rem" }}
                        />
                        <XAxis
                          dataKey="date"
                          dy={10}
                          tickFormatter={(value) => {
                            return format(new Date(value), "MMM' 'd");
                          }}
                          tickLine={{ stroke: "#f97316" }}
                          axisLine={{ stroke: "#71717a" }}
                          tick={{ fill: "#71717a", fontSize: "0.875rem" }}
                        />
                        <ReferenceLine
                          x={activePayload.date}
                          stroke="#f97316"
                          label={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Tab.Panel>
                </Tab.Panels>
                <Tab.List className="mt-4 flex gap-4">
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={clsx(
                          selected
                            ? classes.buttonOrLink.primary
                            : classes.buttonOrLink.secondary,
                          "flex-1"
                        )}
                      >
                        Heaviest Weight
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={clsx(
                          selected
                            ? classes.buttonOrLink.primary
                            : classes.buttonOrLink.secondary,
                          "flex-1"
                        )}
                      >
                        One Rep Max
                      </button>
                    )}
                  </Tab>
                </Tab.List>
              </Tab.Group>
            </>
          ) : null}

          {performances.length > 0 ? (
            <>
              <h3 className="mb-3 mt-6 text-zinc-700 dark:text-zinc-300">
                History
              </h3>

              <ol className="flex flex-col gap-4">
                {performances.map((performance) => (
                  <ExercisePerformance
                    key={performance.id}
                    performance={performance}
                    weightUnitPreference={weightUnitPreference}
                  />
                ))}
              </ol>
            </>
          ) : (
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              You haven't performed this exercise yet.
            </p>
          )}
        </Card>
      </AppPageLayout>

      {/* Can't edit or delete shared exercises */}
      {exercise.shared ? null : (
        <>
          <ExerciseOptionsModal
            show={showExerciseOptionsModal}
            setShow={setShowExerciseOptionsModal}
            setShowDeleteExerciseModal={setShowDeleteExerciseModal}
          />

          <DeleteExerciseModal
            show={showDeleteExerciseModal}
            setShow={setShowDeleteExerciseModal}
          />
        </>
      )}
    </>
  );
}
