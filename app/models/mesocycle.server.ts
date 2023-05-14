import { parse } from "@conform-to/zod";
import type { ActionArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import { nanoid } from "nanoid";
import { configRoutes } from "~/config-routes";
import { prisma } from "~/db.server";
import { schema as createDraftMesocycleSchema } from "~/routes/app.new-mesocycle._index/schema";
import { schema as createMesocycleSchema } from "~/routes/app.new-mesocycle.design.$id/route";
import { getSession, requireUser, sessionStorage } from "~/session.server";

export type DraftMesocycle = {
  name: string;
  goal: string;
  durationInWeeks: number;
  trainingDaysPerWeek: number;
};

const getDraftMesocycleSessionKey = (id: string) => `draft-mesocycle-${id}`;

export async function createDraftMesocycle(request: Request) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema: createDraftMesocycleSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { durationInWeeks, goal, name, trainingDaysPerWeek } = submission.value;

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

  const session = await getSession(request);
  const id = nanoid();
  session.set(getDraftMesocycleSessionKey(id), {
    durationInWeeks,
    goal,
    name,
    trainingDaysPerWeek,
  });

  return redirect(configRoutes.newMesocycleDesign(id), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getDraftMesocycle(
  request: Request,
  id: string
): Promise<DraftMesocycle | null> {
  const session = await getSession(request);
  const mesocycle = await session.get(getDraftMesocycleSessionKey(id));
  return mesocycle;
}

export async function createMesocycle(
  request: Request,
  params: ActionArgs["params"]
) {
  const user = await requireUser(request);

  const { id } = params;
  if (!id) {
    return redirect(configRoutes.newMesocycle);
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema: createMesocycleSchema });
  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const draftMesocycle = await getDraftMesocycle(request, id);
  if (!draftMesocycle) {
    return redirect(configRoutes.newMesocycle);
  }

  const { name, goal, durationInWeeks } = draftMesocycle;
  const { trainingDays } = submission.value;

  try {
    const mesocycle = await prisma.mesocycle.create({
      data: {
        name,
        durationInWeeks,
        goal,
        userId: user.id,
        trainingDays: {
          create: trainingDays.map((trainingDay) => ({
            label: trainingDay.label,
            number: trainingDay.dayNumber,
            exercises: {
              create: trainingDay.exercises.map((exercise) => ({
                notes: exercise.notes,
                exerciseId: exercise.id,
                sets: {
                  create: exercise.sets.map((set, index) => {
                    // The incoming set rep range will have the format:
                    // "x-y" or for example "5-8" so we need to extract the bounds.
                    const repRangeBounds = set.repRange.split("-");
                    const repRangeLowerBound = Number(repRangeBounds[0]);
                    const repRangeUpperBound = Number(repRangeBounds[1]);

                    return {
                      number: index + 1,
                      weight: set.weight,
                      repRangeLowerBound,
                      repRangeUpperBound,
                      rir: set.rir,
                    };
                  }),
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

    const session = await getSession(request);
    session.unset(getDraftMesocycleSessionKey(id));
    return redirect(configRoutes.mesocycleView(mesocycle.id), {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    submission.error["form"] =
      "Something went wrong saving the mesocycle, try again later.";

    return json(submission, { status: 500 });
  }
}

export async function getMesocycles(userId: string) {
  return prisma.mesocycle.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      goal: true,
      durationInWeeks: true,
      _count: { select: { trainingDays: true } },
    },
  });
}
