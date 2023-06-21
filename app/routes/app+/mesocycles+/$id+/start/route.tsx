import { conform, useForm } from "@conform-to/react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import type {
  ActionArgs,
  LoaderArgs,
  SerializeFrom,
} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import { Input } from "~/components/input";
import { configRoutes } from "~/utils/routes";
import { SubmitButton } from "~/components/submit-button";
import { AppPageLayout } from "~/components/app-page-layout";
import { prisma } from "~/utils/db.server";
import { addDays, startOfDay } from "date-fns";
import type { MatchWithHeader } from "~/utils/hooks";
import { sleep } from "~/utils/sleep";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => `Start ${data.mesocycle.name}`,
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
                  id: true,
                  name: true,
                  muscleGroups: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              number: true,
              notes: true,
              sets: {
                orderBy: { number: "asc" },
                select: {
                  id: true,
                  number: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                  weight: true,
                  rir: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  return json({ mesocycle });
};

export const action = async ({ request, params }: ActionArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });
  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const mesocycle = await prisma.mesocycle.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      microcycles: true,
      restDays: true,
      _count: { select: { trainingDays: true } },
      trainingDays: {
        select: {
          number: true,
          label: true,
          exercises: {
            select: {
              exercise: { select: { id: true } },
              notes: true,
              number: true,
              sets: {
                select: {
                  number: true,
                  weight: true,
                  rir: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mesocycle) {
    throw new Response("Not found", {
      status: 404,
    });
  }

  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: { id: true },
  });

  if (currentMesocycle) {
    submission.error["form"] =
      "You can't start this mesocycle because you are currently in the middle of one. You can stop your current mesocycle on the mesocycles page and then start this one.";

    return json(submission, { status: 400 });
  }

  const totalMesocycleDays =
    mesocycle.microcycles *
    (mesocycle.restDays.length + mesocycle._count.trainingDays);

  const endDate = addDays(submission.value.startDate, totalMesocycleDays);
  const startDate = startOfDay(submission.value.startDate);

  const microcycleLength =
    mesocycle._count.trainingDays + mesocycle.restDays.length;

  let previousMesocycleRun = null;
  if (submission.value.linkPreviousRun) {
    previousMesocycleRun = await prisma.mesocycleRun.findFirst({
      where: {
        ranByUserId: user.id,
        mesocycleId: mesocycle.id,
      },
      orderBy: {
        endDate: "desc",
      },
      select: {
        id: true,
      },
    });
  }

  const mesocycleRun = await prisma.mesocycleRun.create({
    data: {
      mesocycle: { connect: { id } },
      currentUser: { connect: { id: user.id } },
      ranByUser: { connect: { id: user.id } },
      previousRun: previousMesocycleRun
        ? { connect: { id: previousMesocycleRun.id } }
        : undefined,
      progressiveRir: submission.value.progressiveRir,
      startDate,
      endDate,
    },
    select: {
      id: true,
    },
  });

  // Creating all the microcycles can take a long time so we are waiting only for 2 seconds.
  await Promise.race([
    sleep(2000),
    prisma.mesocycleRun.update({
      where: {
        id: mesocycleRun.id,
      },
      data: {
        microcycles: {
          // Create the microcycles with the values from the mesocycle.
          create: Array.from(
            { length: mesocycle.microcycles },
            (_, i) => i
          ).map((microcycleIndex) => ({
            restDays: mesocycle.restDays,
            trainingDays: {
              create: mesocycle.trainingDays.map((trainingDay) => ({
                number: trainingDay.number,
                label: trainingDay.label,
                completed: false,
                date: addDays(
                  startDate,
                  microcycleIndex * microcycleLength + trainingDay.number - 1
                ),
                exercises: {
                  create: trainingDay.exercises.map((exercise) => ({
                    number: exercise.number,
                    notes: exercise.notes,
                    exercise: { connect: { id: exercise.exercise?.id } },
                    sets: {
                      create: exercise.sets.map((set) => ({
                        number: set.number,
                        repRangeLowerBound: set.repRangeLowerBound,
                        repRangeUpperBound: set.repRangeUpperBound,
                        rir: set.rir,
                        weight: set.weight,
                        completed: false,
                      })),
                    },
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
    }),
  ]);

  return redirect(configRoutes.app.current);
};

export default function StartMesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, { startDate, linkPreviousRun, progressiveRir }] =
    useForm<Schema>({
      id: "delete-exercises",
      lastSubmission,
      defaultValue: {
        linkPreviousRun: "on",
        progressiveRir: "off",
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  return (
    <AppPageLayout>
      <Heading className="hidden text-zinc-900 lg:block">
        {mesocycle.name}
      </Heading>

      <Form method="post" className="lg:mt-6" {...form.props}>
        <Input
          config={startDate}
          label="When do you want to start the mesocycle?"
          helperText="This is the date your first microcycle will commence."
          type="date"
        />

        <div className="relative mt-6 flex items-start">
          <div className="flex h-6 items-center">
            <input
              {...conform.input(linkPreviousRun, { type: "checkbox" })}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label
              htmlFor={linkPreviousRun.id}
              className="block text-sm font-medium leading-6 text-zinc-900"
            >
              Link with previous run
            </label>
            <p id="comments-description" className="text-gray-500">
              Link this run to the previous one and carry your performance over.
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex items-start">
          <div className="flex h-6 items-center">
            <input
              {...conform.input(progressiveRir, { type: "checkbox" })}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label
              htmlFor={progressiveRir.id}
              className="block text-sm font-medium leading-6 text-zinc-900"
            >
              Progressive RIR
            </label>
            <p id="comments-description" className="text-gray-500">
              Progresses your RIR automatically every microcycle. For example if
              your initial RIR for a set is 3, the next microcycle it will be 2,
              the next 1 and so on.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SubmitButton className="w-full" text="Start mesocycle" />
        </div>
      </Form>
    </AppPageLayout>
  );
}
