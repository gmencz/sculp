import { parse } from "@conform-to/zod";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import { WeightUnitPreference, schema } from "./schema";
import { Tab } from "@headlessui/react";
import { CustomMesocycle } from "./custom";
import { PresetMesocycle } from "./preset";
import clsx from "clsx";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import type { MatchWithHeader } from "~/utils/hooks";
import { configRoutes } from "~/utils/routes";
import { WeightUnit } from "@prisma/client";
import { Heading } from "~/components/heading";

export const handle: MatchWithHeader = {
  header: () => "Plan a new mesocycle",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);

  const mesocyclesPresets = await prisma.mesocyclePreset.findMany({
    select: {
      name: true,
      microcycles: true,
      restDays: true,
      trainingDays: {
        select: {
          number: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return json({
    mesocyclesPresets,
  });
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const {
    durationInMicrocycles,
    restDaysPerMicrocycle,
    goal,
    name,
    trainingDaysPerMicrocycle,
    presetName,
    weightUnitPreference,
  } = submission.value;

  const existingMesocycle = await prisma.mesocycle.findUnique({
    where: {
      name_userId: {
        name,
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingMesocycle) {
    submission.error["name"] = "A mesocycle with that name already exists.";
    return json(submission, { status: 400 });
  }

  // Use preset.
  if (presetName) {
    const preset = await prisma.mesocyclePreset.findUnique({
      where: {
        name: presetName,
      },
      select: {
        restDays: true,
        microcycles: true,
        trainingDays: {
          select: {
            label: true,
            number: true,
            exercises: {
              select: {
                number: true,
                notes: true,
                exerciseId: true,
                sets: {
                  select: {
                    number: true,
                    repRangeLowerBound: true,
                    repRangeUpperBound: true,
                    rir: true,
                    weight: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!preset) {
      throw new Error(
        `Preset not found with name ${presetName}. This shouldn't happen`
      );
    }

    const newMesocycle = await prisma.mesocycle.create({
      data: {
        goal,
        name,
        microcycles: preset.microcycles,
        user: { connect: { id: user.id } },
        restDays: { set: preset.restDays },
        weightUnitPreference:
          weightUnitPreference === WeightUnitPreference.kg
            ? WeightUnit.KILOGRAM
            : WeightUnit.POUND,
        trainingDays: {
          create: preset.trainingDays.map((trainingDay) => ({
            label: trainingDay.label,
            number: trainingDay.number,
            exercises: {
              create: trainingDay.exercises.map((exercise) => ({
                number: exercise.number,
                notes: exercise.notes,
                exerciseId: exercise.exerciseId,
                sets: {
                  create: exercise.sets.map((set) => ({
                    number: set.number,
                    repRangeLowerBound: set.repRangeLowerBound,
                    repRangeUpperBound: set.repRangeUpperBound,
                    rir: set.rir,
                    weight: set.weight,
                  })),
                },
              })),
            },
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return redirect(configRoutes.app.mesocycles.view(newMesocycle.id));
  }

  const invalidRestDays = restDaysPerMicrocycle.some((restDay) =>
    trainingDaysPerMicrocycle.includes(restDay)
  );

  if (invalidRestDays) {
    submission.error["restDaysPerMicrocycle"] =
      "The selected rest days are not valid.";
    return json(submission, { status: 400 });
  }

  const newMesocycle = await prisma.mesocycle.create({
    data: {
      goal,
      name,
      microcycles: durationInMicrocycles,
      user: { connect: { id: user.id } },
      restDays: { set: restDaysPerMicrocycle.sort((a, b) => a - b) },
      weightUnitPreference:
        weightUnitPreference === WeightUnitPreference.kg
          ? WeightUnit.KILOGRAM
          : WeightUnit.POUND,
      trainingDays: {
        create: trainingDaysPerMicrocycle
          .sort((a, b) => a - b)
          .map((number) => ({
            number,
          })),
      },
    },
    select: {
      id: true,
    },
  });

  return redirect(configRoutes.app.mesocycles.view(newMesocycle.id));
};

const tabs = ["Preset", "Custom"];

export default function NewMesocycle() {
  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-8 lg:pb-0 lg:pt-10">
      <div className="mx-auto w-full max-w-2xl">
        <Heading className="hidden text-zinc-900 dark:text-zinc-50 lg:mb-8 lg:block">
          Plan a new mesocycle
        </Heading>

        <Tab.Group>
          <Tab.List className="flex">
            {tabs.map((tab, index) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  clsx(
                    selected
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      : "bg-white text-zinc-500 hover:text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-200",

                    index === 0
                      ? "rounded-bl rounded-tl"
                      : index === tabs.length - 1
                      ? "rounded-br rounded-tr"
                      : null,

                    "flex-1 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                  )
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <PresetMesocycle />
            </Tab.Panel>

            <Tab.Panel>
              <CustomMesocycle />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
