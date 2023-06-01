import { parse } from "@conform-to/zod";
import { Link } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import {
  createDraftMesocycle,
  findMesocycleByNameUserId,
  getMesocyclePresetByName,
  getMesocyclesPresets,
} from "~/models/mesocycle.server";
import { schema } from "./schema";
import { ArrowLongLeftIcon } from "@heroicons/react/20/solid";
import { configRoutes } from "~/config-routes";
import { Tab } from "@headlessui/react";
import { CustomMesocycle } from "./custom";
import { PresetMesocycle } from "./preset";
import clsx from "clsx";
import { BackLink } from "~/components/back-link";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);

  const mesocyclesPresets = await getMesocyclesPresets();

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

  const existingMesocycle = await findMesocycleByNameUserId(name, user.id);

  if (existingMesocycle) {
    submission.error["name"] = "A mesocycle with that name already exists.";
    return json(submission, { status: 400 });
  }

  // Use preset.
  if (presetName) {
    const preset = await getMesocyclePresetByName(presetName);
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
      presetName,
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
        <Heading>Plan a new mesocycle</Heading>
        <Paragraph className="mt-1">
          A mesocycle is a structured training plan designed to help you achieve
          maximum muscle growth. Use a preset designed by a hypertrophy expert
          or design your own.
        </Paragraph>

        <div className="mt-4">
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
    </div>
  );
}
