import { parse } from "@conform-to/zod";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { schema } from "./schema";
import { Tab } from "@headlessui/react";
import { CustomMesocycle } from "./custom";
import { PresetMesocycle } from "./preset";
import clsx from "clsx";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import { createDraftMesocycle } from "~/utils/mesocycles.server";
import type { MatchWithHeader } from "~/utils/hooks";

export const handle: MatchWithHeader = {
  header: "Plan a new mesocycle",
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

  return json({ mesocyclesPresets });
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
      select: { name: true },
    });

    if (!preset) {
      throw new Error(
        `Preset not found with name ${presetName}. This shouldn't happen`
      );
    }

    return createDraftMesocycle(request, {
      durationInMicrocycles,
      goal,
      name,
      trainingDaysPerMicrocycle: trainingDaysPerMicrocycle.sort(
        (a, b) => a - b
      ),
      restDaysPerMicrocycle: restDaysPerMicrocycle.sort((a, b) => a - b),
      presetName: preset.name,
    });
  }

  const invalidRestDays = restDaysPerMicrocycle.some((restDay) =>
    trainingDaysPerMicrocycle.includes(restDay)
  );

  if (invalidRestDays) {
    submission.error["restDaysPerMicrocycle"] =
      "The selected rest days are not valid.";
    return json(submission, { status: 400 });
  }

  return createDraftMesocycle(request, {
    durationInMicrocycles,
    goal,
    name,
    restDaysPerMicrocycle: restDaysPerMicrocycle.sort((a, b) => a - b),
    trainingDaysPerMicrocycle: trainingDaysPerMicrocycle.sort((a, b) => a - b),
  });
};

const tabs = ["Preset", "Custom"];

export default function NewMesocycle() {
  return (
    <div className="px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-0 lg:pt-10">
      <div className="mx-auto w-full max-w-2xl">
        <Tab.Group>
          <Tab.List className="flex">
            {tabs.map((tab, index) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  clsx(
                    selected
                      ? "bg-orange-100 text-orange-700"
                      : "bg-white text-zinc-500 hover:text-zinc-700",

                    index === 0
                      ? "rounded-bl rounded-tl"
                      : index === tabs.length - 1
                      ? "rounded-br rounded-tr"
                      : null,

                    "flex-1 px-3 py-2 text-sm font-medium"
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
