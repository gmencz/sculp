import type { ActionArgs } from "@remix-run/server-runtime";
import {
  json,
  type LoaderArgs,
  type SerializeFrom,
} from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import { type MatchWithHeader } from "~/utils/hooks";
import { parse } from "@conform-to/zod";
import { redirectBack } from "~/utils/responses.server";
import { configRoutes } from "~/utils/routes";
import { getRepRangeBounds } from "~/utils/rep-ranges";
import { commitSession, getSessionFromCookie } from "~/utils/session.server";
import {
  ActionIntents,
  addSetSchema,
  intentSchema,
  removeExerciseSchema,
  removeSetSchema,
  reorderExercisesSchema,
  updateExerciseNotesSchema,
  updateSetSchema,
  updateTrainingDayLabelSchema,
} from "./schema";
import { TrainingDay } from "./training-day";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) => data.trainingDay.mesocycle!.name,
  links: [],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { trainingDayId } = params;
  if (!trainingDayId) {
    throw new Error("trainingDayId param is falsy, this should never happen");
  }

  const trainingDay = await prisma.mesocycleTrainingDay.findFirst({
    where: {
      id: trainingDayId,
      mesocycle: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      label: true,
      number: true,
      mesocycle: {
        select: {
          name: true,
        },
      },
      exercises: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          notes: true,
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
  });

  if (!trainingDay) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const session = await getSessionFromCookie(request);
  return json(
    { trainingDay, scrollToBottom: Boolean(session.get("scrollToBottom")) },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

export const action = async ({ request, params }: ActionArgs) => {
  await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema: intentSchema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  const { actionIntent } = intentSubmission.value;

  switch (actionIntent) {
    case ActionIntents.UpdateSet: {
      const submission = parse(formData, { schema: updateSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id: setId, repRange, rir, weight } = submission.value;

      const [repRangeLowerBound, repRangeUpperBound] =
        getRepRangeBounds(repRange);

      await prisma.mesocycleTrainingDayExerciseSet.update({
        where: {
          id: setId,
        },
        data: {
          repRangeLowerBound: { set: repRangeLowerBound },
          repRangeUpperBound: { set: repRangeUpperBound },
          rir: { set: rir },
          weight: { set: weight },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case ActionIntents.RemoveSet: {
      const submission = parse(formData, { schema: removeSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id: setId } = submission.value;

      const deleted = await prisma.mesocycleTrainingDayExerciseSet.delete({
        where: {
          id: setId,
        },
        select: {
          mesocycleTrainingDayExerciseId: true,
          number: true,
        },
      });

      // Update the `number` value for the sets after the one we removed.
      await prisma.mesocycleTrainingDayExerciseSet.updateMany({
        where: {
          AND: [
            {
              mesocycleTrainingDayExerciseId:
                deleted.mesocycleTrainingDayExerciseId,
            },
            { number: { gt: deleted.number } },
          ],
        },
        data: {
          number: { decrement: 1 },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case ActionIntents.AddSet: {
      const submission = parse(formData, { schema: addSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, setId } = submission.value;

      const lastSet = await prisma.mesocycleTrainingDayExerciseSet.findFirst({
        where: {
          mesocycleTrainingDayExerciseId: id,
        },
        orderBy: {
          number: "desc",
        },
      });

      await prisma.mesocycleTrainingDayExerciseSet.create({
        data: {
          id: setId,
          mesocycleTrainingDayExercise: { connect: { id } },
          number: lastSet?.number ? lastSet.number + 1 : 1,
          repRangeLowerBound: lastSet?.repRangeLowerBound || 5,
          repRangeUpperBound: lastSet?.repRangeUpperBound || 8,
          weight: lastSet?.weight,
          rir: lastSet?.rir || 0,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case ActionIntents.UpdateExerciseNotes: {
      const submission = parse(formData, { schema: updateExerciseNotesSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, notes } = submission.value;

      await prisma.mesocycleTrainingDayExercise.update({
        where: {
          id,
        },
        data: {
          notes: { set: notes },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case ActionIntents.RemoveExercise: {
      const submission = parse(formData, { schema: removeExerciseSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id } = submission.value;

      const deleted = await prisma.mesocycleTrainingDayExercise.delete({
        where: {
          id,
        },
        select: {
          number: true,
        },
      });

      await prisma.mesocycleTrainingDayExercise.updateMany({
        where: {
          AND: [
            { mesocycleTrainingDayId: params.trainingDayId },
            { number: { gt: deleted.number } },
          ],
        },
        data: {
          number: { decrement: 1 },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case ActionIntents.UpdateTrainingDayLabel: {
      const submission = parse(formData, {
        schema: updateTrainingDayLabelSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { label } = submission.value;

      await prisma.mesocycleTrainingDay.update({
        where: {
          id: params.trainingDayId,
        },
        data: {
          label,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case ActionIntents.ReorderExercises: {
      const submission = parse(formData, {
        schema: reorderExercisesSchema,
      });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { orderedExercisesIds } = submission.value;
      const orderedExercisesIdsWithNumbers = orderedExercisesIds.map(
        (exerciseId, index) => ({ id: exerciseId, number: index + 1 })
      );

      const currentOrderedExercises =
        await prisma.mesocycleTrainingDayExercise.findMany({
          where: {
            mesocycleTrainingDayId: params.trainingDayId,
          },
          orderBy: { number: "asc" },
          select: {
            id: true,
          },
        });

      const exercisesToUpdate = orderedExercisesIdsWithNumbers.filter(
        ({ id }, index) => currentOrderedExercises[index]?.id !== id
      );

      if (!exercisesToUpdate.length) {
        return redirectBack(request, {
          fallback: configRoutes.app.mesocycles.list,
        });
      }

      await prisma.$transaction(
        exercisesToUpdate.map(({ id, number }) =>
          prisma.mesocycleTrainingDayExercise.update({
            where: {
              id,
            },
            data: {
              number,
            },
          })
        )
      );

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    default: {
      throw new Error("The action intent is not valid");
    }
  }
};

export default function TrainingDayRoute() {
  return <TrainingDay />;
}
