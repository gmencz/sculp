import { useForm } from "@conform-to/react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import type {
  ActionArgs,
  LoaderArgs,
  SerializeFrom,
} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import clsx from "clsx";
import { Input } from "~/components/input";
import { configRoutes } from "~/utils/routes";
import { SubmitButton } from "~/components/submit-button";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { AppPageLayout } from "~/components/app-page-layout";
import { Disclosure } from "@headlessui/react";
import { prisma } from "~/utils/db.server";
import { addDays, startOfDay } from "date-fns";
import type { MatchWithHeader } from "~/utils/hooks";
import { useMemo } from "react";
import { getUniqueMuscleGroups } from "~/utils/muscle-groups";

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

  await prisma.mesocycleRun.create({
    data: {
      mesocycle: { connect: { id } },
      currentUser: { connect: { id: user.id } },
      ranByUser: { connect: { id: user.id } },
      startDate,
      endDate,
      microcycles: {
        // Create the microcycles with the values from the mesocycle.
        create: Array.from({ length: mesocycle.microcycles }, (_, i) => i).map(
          (microcycleIndex) => ({
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
          })
        ),
      },
    },
  });

  return redirect(configRoutes.app.current);
};

export default function StartMesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData() as any as any;
  const [form, { startDate }] = useForm<Schema>({
    id: "delete-exercises",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <AppPageLayout>
      <Heading className="hidden text-zinc-900 lg:block">
        {mesocycle.name}
      </Heading>
      <Paragraph className="hidden lg:mt-1 lg:block">
        Review your mesocycle to make sure everything looks good before starting
        your training. Keep in mind that the sets, weights and RIR (Reps In
        Reserve) shown here are your starting point and you can change them any
        time during your training.
      </Paragraph>

      <nav className="divide-y divide-zinc-200 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl lg:mt-6">
        {mesocycle.trainingDays.map((trainingDay, index) => (
          <TrainingDay
            key={trainingDay.id}
            trainingDay={trainingDay}
            index={index}
          />
        ))}
      </nav>

      <Form method="post" className="mt-8" {...form.props}>
        <Input
          config={startDate}
          label="When do you want to start the mesocycle?"
          helperText="This is the date your first microcycle will commence."
          type="date"
        />

        <div className="mt-6">
          <SubmitButton className="w-full" text="Start mesocycle" />
        </div>
      </Form>
    </AppPageLayout>
  );
}

type TrainingDayProps = {
  trainingDay: SerializeFrom<
    typeof loader
  >["mesocycle"]["trainingDays"][number];
  index: number;
};

function TrainingDay({ trainingDay, index }: TrainingDayProps) {
  const muscleGroups = useMemo(
    () => getUniqueMuscleGroups(trainingDay),
    [trainingDay]
  );

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={clsx(
              "flex w-full items-center justify-between gap-2 bg-white px-6 py-4 text-sm font-semibold leading-6 text-zinc-900 hover:bg-orange-50",
              index === 0 ? "sm:rounded-tl-xl sm:rounded-tr-xl" : null
            )}
          >
            <div className="flex flex-col items-start gap-2">
              <h3>
                Training Day {trainingDay.number} - {trainingDay.label}
              </h3>

              <ul className="flex flex-wrap gap-2">
                {muscleGroups.map((muscleGroup, index) => (
                  <li key={muscleGroup}>
                    <MuscleGroupBadge index={index}>
                      {muscleGroup}
                    </MuscleGroupBadge>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <ChevronUpIcon
                className={clsx(
                  "h-5 w-5 transform text-orange-500",
                  open ? "rotate-180" : "rotate-90"
                )}
              />
            </div>
          </Disclosure.Button>

          <Disclosure.Panel>
            <ol className="relative divide-y divide-zinc-100">
              {trainingDay.exercises.map((exercise) => (
                <li key={exercise.id} className="flex w-full gap-x-4 px-6 py-5">
                  <svg
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 485.535 485.535"
                    className="h-7 w-7 text-zinc-600"
                  >
                    <g>
                      <g id="_x35__13_">
                        <g>
                          <path
                            d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
                          />
                          <path
                            d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
                          />
                          <path
                            d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                  <div className="min-w-0 flex-1  ">
                    <p className="flex items-center gap-2 text-sm font-semibold leading-6 text-zinc-900">
                      <span>{exercise.exercise?.name}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 px-3 py-0.5 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
                        {exercise.number}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-sm leading-5 text-zinc-500">
                      {exercise.sets.length} sets
                    </p>

                    <table className="mt-2 min-w-full divide-y divide-zinc-300 border-b border-zinc-300">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="py-2 pl-0 pr-3 text-left text-sm font-semibold text-zinc-900"
                          >
                            Set
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-sm font-semibold text-zinc-900"
                          >
                            Weight
                          </th>
                          <th
                            scope="col"
                            className="hidden px-3 py-2 text-left text-sm font-semibold text-zinc-900 xs:table-cell"
                          >
                            Rep range
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-sm font-semibold text-zinc-900"
                          >
                            RIR
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {exercise.sets.map((set) => (
                          <tr key={set.id}>
                            <td className="w-full max-w-0 py-2 pl-0 pr-3 text-sm font-medium text-zinc-900 xs:w-auto xs:max-w-none">
                              {set.number}
                              <dl className="font-normal xs:hidden">
                                <dt className="sr-only">Rep range</dt>
                                <dd className="mt-1 truncate text-zinc-700">
                                  {set.repRangeLowerBound}-
                                  {set.repRangeUpperBound} reps
                                </dd>
                              </dl>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-500">
                              {set.weight}
                            </td>
                            <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-zinc-500 xs:table-cell">
                              {set.repRangeLowerBound}-{set.repRangeUpperBound}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-zinc-500">
                              {set.rir}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <p className="mt-4 truncate text-sm leading-5 text-zinc-500">
                      {exercise.notes
                        ? exercise.notes
                        : "No notes for this exercise."}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
