import { useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import {
  differenceInDays,
  format,
  isAfter,
  isSameDay,
  startOfToday,
} from "date-fns";
import { CurrentMesocycleNotFound } from "./current-mesocycle-not-found";
import { CurrentMesocycleStartsInTheFuture } from "./current-mesocycle-starts-in-the-future";
import { parse } from "@conform-to/zod";
import {
  addSetSchema,
  finishOrUpdateSessionSchema,
  schema,
  updateExerciseSchema,
  updateSetSchema,
} from "./schema";
import { prisma } from "~/utils/db.server";
import { configRoutes } from "~/utils/routes";
import { DayPlan } from "./day-plan";
import { redirectBack } from "~/utils/responses.server";
import { getRepRangeBounds } from "~/utils/rep-ranges";
import { requireUser } from "~/services/auth/api/require-user";
import { getSessionFromCookie } from "~/utils/session.server";
import {
  getMesocycleRunCalendarDays,
  getMesocycleRunDayByDate,
} from "~/utils/mesocycles.server";
import { commitSession } from "~/utils/session.server";
import { generateId } from "~/utils/ids";
import type { MatchWithHeader } from "~/utils/hooks";

export const handle: MatchWithHeader = {
  header: "Current mesocycle",
  links: [],
};

export enum CurrentMesocycleState {
  NOT_FOUND,
  STARTS_IN_THE_FUTURE,
  STARTED,
}

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  let state: CurrentMesocycleState;
  const currentMesocycle = await prisma.mesocycleRun.findFirst({
    where: {
      currentUserId: user.id,
    },
    select: {
      startDate: true,
      endDate: true,
      mesocycle: {
        select: {
          name: true,
          microcycles: true,
          restDays: true,
          _count: { select: { trainingDays: true } },
        },
      },
      microcycles: {
        select: {
          restDays: true,
          trainingDays: {
            orderBy: {
              number: "asc",
            },
            select: {
              id: true,
              number: true,
              date: true,
            },
          },
        },
      },
    },
  });

  if (!currentMesocycle) {
    state = CurrentMesocycleState.NOT_FOUND;

    return json({
      state,
      mesocyclesCount: await prisma.mesocycle.count({
        where: {
          userId: user.id,
        },
      }),
    });
  }

  const today = startOfToday();

  // The user starts the mesocycle some time in the future.
  if (isAfter(currentMesocycle.startDate, today)) {
    const daysDifference = differenceInDays(currentMesocycle.startDate, today);
    let formattedStartDate;
    if (daysDifference === 1) {
      formattedStartDate = "tomorrow";
    } else {
      formattedStartDate = `on the ${format(
        currentMesocycle.startDate,
        "do' of 'MMMM'"
      )} (in ${daysDifference} days)`;
    }

    state = CurrentMesocycleState.STARTS_IN_THE_FUTURE;
    return json({
      state,
      formattedStartDate,
      mesocycleName: currentMesocycle.mesocycle.name,
    });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  let date: Date;
  if (dateParam) {
    date = new Date(decodeURIComponent(dateParam));
  } else {
    date = today;
  }

  const microcycleLength =
    currentMesocycle.mesocycle._count.trainingDays +
    currentMesocycle.mesocycle.restDays.length;

  const calendarDays = getMesocycleRunCalendarDays(
    {
      startDate: currentMesocycle.startDate,
      endDate: currentMesocycle.endDate,
      microcycles: currentMesocycle.microcycles,
      microcycleLength,
    },
    date
  );

  const day = getMesocycleRunDayByDate(
    {
      startDate: currentMesocycle.startDate,
      endDate: currentMesocycle.endDate,
      microcycles: currentMesocycle.microcycles,
      microcycleLength,
    },
    date
  );

  if (!day) {
    throw new Error("day is null, this should never happen");
  }

  const session = await getSessionFromCookie(request);

  const trainingDaySessionUpdated = ((await session.get(
    "trainingDaySessionUpdated"
  )) || null) as string | null;

  const trainingDaySessionFinished = ((await session.get(
    "trainingDaySessionFinished"
  )) || null) as string | null;

  state = CurrentMesocycleState.STARTED;
  if (day.trainingDay?.id) {
    const trainingDayData =
      await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
        where: { id: day.trainingDay.id },
        select: {
          id: true,
          completed: true,
          label: true,
          date: true,
          feedback: true,
          exercises: {
            orderBy: {
              number: "asc",
            },
            select: {
              id: true,
              notes: true,
              number: true,
              previousRun: {
                select: {
                  sets: {
                    orderBy: {
                      number: "asc",
                    },
                    select: {
                      id: true,
                      number: true,
                      completed: true,
                      repRangeLowerBound: true,
                      repRangeUpperBound: true,
                      repsCompleted: true,
                      rir: true,
                      weight: true,
                    },
                  },
                },
              },
              exercise: {
                select: {
                  name: true,
                  notes: true,
                  muscleGroups: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              sets: {
                orderBy: {
                  number: "asc",
                },
                select: {
                  id: true,
                  number: true,
                  completed: true,
                  repRangeLowerBound: true,
                  repRangeUpperBound: true,
                  repsCompleted: true,
                  rir: true,
                  weight: true,
                },
              },
            },
          },
        },
      });

    if (!trainingDayData) {
      throw new Error("trainingDayData is null, this should never happen");
    }

    // Read only if it's a day in the future (doesn't make sense to update/finish a day you haven't done yet).
    const readOnly = isAfter(trainingDayData.date, today);

    return json(
      {
        state,
        mesocycleName: currentMesocycle.mesocycle.name,
        microcycleLength,
        calendarDays,
        readOnly,
        trainingDaySessionUpdated,
        trainingDaySessionFinished,
        day: {
          dayNumber: day.dayNumber,
          microcycleNumber: day.microcycleNumber,
          trainingDay: trainingDayData,
        },
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  }

  return json(
    {
      state,
      mesocycleName: currentMesocycle.mesocycle.name,
      microcycleLength,
      calendarDays,
      readOnly: true,
      trainingDaySessionUpdated,
      trainingDaySessionFinished,
      day: {
        dayNumber: day.dayNumber,
        microcycleNumber: day.microcycleNumber,
        trainingDay: null,
      },
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  const { actionIntent } = intentSubmission.value;

  switch (actionIntent) {
    case "update-set": {
      const submission = parse(formData, { schema: updateSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const {
        id: setId,
        repRange,
        repsCompleted,
        rir,
        weight,
        wantsToComplete,
        wantsToRemove,
      } = submission.value;

      if (wantsToRemove) {
        const deleted =
          await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.delete({
            where: {
              id: setId,
            },
            select: {
              exerciseId: true,
              number: true,
            },
          });

        // Update the `number` value for the sets after the one we removed.
        await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.updateMany({
          where: {
            AND: [
              { exerciseId: deleted.exerciseId },
              { number: { gt: deleted.number } },
            ],
          },
          data: {
            number: { decrement: 1 },
          },
        });

        return redirectBack(request, { fallback: configRoutes.app.current });
      }

      const [repRangeLowerBound, repRangeUpperBound] =
        getRepRangeBounds(repRange);

      await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.update({
        where: {
          id: setId,
        },
        data: {
          repRangeLowerBound: { set: repRangeLowerBound },
          repRangeUpperBound: { set: repRangeUpperBound },
          completed: { set: wantsToComplete },
          repsCompleted: { set: repsCompleted },
          rir: { set: rir },
          weight: { set: weight },
        },
      });

      return redirectBack(request, { fallback: configRoutes.app.current });
    }

    case "update-exercise": {
      const submission = parse(formData, { schema: updateExerciseSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, notes } = submission.value;

      await prisma.mesocycleRunMicrocycleTrainingDayExercise.update({
        where: {
          id,
        },
        data: {
          notes: { set: notes },
        },
      });

      return redirectBack(request, { fallback: configRoutes.app.current });
    }

    case "add-set": {
      const submission = parse(formData, { schema: addSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, setId } = submission.value;

      const lastSet =
        await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.findFirst({
          where: {
            exerciseId: id,
          },
          orderBy: {
            number: "desc",
          },
        });

      await prisma.mesocycleRunMicrocycleTrainingDayExerciseSet.create({
        data: {
          id: setId,
          exercise: { connect: { id } },
          number: lastSet?.number ? lastSet.number + 1 : 1,
          repRangeLowerBound: lastSet?.repRangeLowerBound || 5,
          repRangeUpperBound: lastSet?.repRangeUpperBound || 8,
          weight: lastSet?.weight,
          rir: lastSet?.rir || 0,
          completed: false,
          repsCompleted: 0,
        },
      });

      return redirectBack(request, { fallback: configRoutes.app.current });
    }

    case "finish-or-update-session": {
      const submission = parse(formData, {
        schema: finishOrUpdateSessionSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, feedback } = submission.value;

      const thisTrainingDay =
        await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
          where: {
            AND: [
              { id },
              {
                exercises: { every: { sets: { every: { completed: true } } } },
              },
            ],
          },
          select: {
            id: true,
            completed: true,
            number: true,
            date: true,
            microcycle: {
              select: {
                mesocycleRun: {
                  select: {
                    endDate: true,
                    mesocycleId: true,
                  },
                },
              },
            },
            exercises: {
              select: {
                sets: {
                  select: {
                    number: true,
                    repRangeUpperBound: true,
                    repsCompleted: true,
                    weight: true,
                  },
                },
              },
            },
          },
        });

      if (!thisTrainingDay || !thisTrainingDay.microcycle?.mesocycleRun) {
        throw new Error(`This training day can't be finished`);
      }

      await prisma.mesocycleRunMicrocycleTrainingDay.update({
        where: {
          id: thisTrainingDay.id,
        },
        data: {
          completed: true,
          feedback,
        },
        select: {
          id: true,
        },
      });

      const lastTrainingDay =
        await prisma.mesocycleRunMicrocycleTrainingDay.findFirst({
          select: {
            date: true,
          },
          orderBy: {
            date: "desc",
          },
        });

      if (!lastTrainingDay) {
        throw new Error(`lastTrainingDay is null, this shouldn't happen.`);
      }

      const isLastDayOfMesocycle = isSameDay(
        thisTrainingDay.date,
        lastTrainingDay.date
      );

      const session = await getSessionFromCookie(request);
      if (thisTrainingDay.completed) {
        session.flash("trainingDaySessionUpdated", generateId());
      } else {
        session.flash("trainingDaySessionFinished", generateId());
      }

      if (isLastDayOfMesocycle) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            currentMesocycleRun: {
              disconnect: true,
            },
          },
          select: {
            id: true,
          },
        });

        return redirect(
          configRoutes.app.mesocycles.viewHistory(
            thisTrainingDay.microcycle.mesocycleRun.mesocycleId
          ),
          {
            headers: {
              "Set-Cookie": await commitSession(session),
            },
          }
        );
      }

      return redirectBack(request, {
        fallback: configRoutes.app.current,
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    default: {
      throw new Error("The action intent is not valid");
    }
  }
};

export default function Current() {
  const data = useLoaderData<typeof loader>();

  if (data.state === CurrentMesocycleState.NOT_FOUND) {
    return <CurrentMesocycleNotFound data={data} />;
  }

  if (data.state === CurrentMesocycleState.STARTS_IN_THE_FUTURE) {
    return <CurrentMesocycleStartsInTheFuture data={data} />;
  }

  return <DayPlan data={data} />;
}
