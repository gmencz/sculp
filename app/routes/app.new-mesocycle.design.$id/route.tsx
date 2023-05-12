import { Form, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import { useFieldList, useForm } from "@conform-to/react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { prisma } from "~/db.server";
import { parse } from "@conform-to/zod";
import {
  addExerciseToDraftMesocycle,
  getDraftMesocycle,
} from "~/models/mesocycle.server";
import { configRoutes } from "~/config-routes";
import { schema as addExerciseFormSchema } from "./add-exercise-form";
import { Heading } from "~/components/heading";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { AddExerciseModal } from "./add-exercise-modal";
import { DeleteExerciseModal } from "./delete-exercise-modal";

export const action = async ({ request, params }: ActionArgs) => {
  await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (!intent) {
    throw new Error("Missing intent");
  }

  const { id: mesocycleId } = params;
  if (!mesocycleId) {
    throw new Error("Missing id");
  }

  switch (intent) {
    case "save-mesocycle": {
      const submission = parse(formData, { schema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      throw new Error("Not implemented");
    }

    case "add-exercise": {
      const submission = parse(formData, { schema: addExerciseFormSchema });
      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, name, sets, notes, dayNumber } = submission.value;
      return addExerciseToDraftMesocycle(request, mesocycleId, {
        dayNumber,
        id,
        name,
        sets,
        notes,
      });
    }

    case "delete-exercise": {
      // TODO
    }

    default: {
      throw new Error("Invalid intent");
    }
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    return redirect(configRoutes.newMesocycle);
  }

  const mesocycle = await getDraftMesocycle(request, id);
  if (!mesocycle) {
    return redirect(configRoutes.newMesocycle);
  }

  const exercises = await prisma.exercise.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return json({ mesocycle, exercises });
};

const schema = z.object({
  trainingDays: z.array(
    z.object({
      label: z
        .string({
          invalid_type_error: "The label is not valid.",
          required_error: "The label is required.",
        })
        .min(1, "The label is required.")
        .max(50, "The label must be at most 50 characters long."),

      exercises: z.array(addExerciseFormSchema),

      dayNumber: z.coerce
        .number({
          invalid_type_error: "The day number is not valid.",
          required_error: "The day number is required.",
        })
        .min(1, `The day number must be at least 1.`)
        .max(6, `The day number can't be greater than 6.`),
    })
  ),
});

export type Schema = z.infer<typeof schema>;

export default function NewMesocycleDesign() {
  const { mesocycle } = useLoaderData<typeof loader>();

  // TODO: Add the exercise name to the exercise and not just the id so we can display it
  // easier without having to .find.

  const [form, { trainingDays }] = useForm<Schema>({
    defaultValue: {
      trainingDays: mesocycle.trainingDays.map((trainingDay) => {
        return {
          dayNumber: trainingDay.dayNumber.toString(),
          label: trainingDay.label,
          exercises: trainingDay.exercises.map((exercise) => {
            return {
              dayNumber: exercise.dayNumber.toString(),
              notes: exercise.notes,
              exercise: {
                id: exercise.id,
                name: exercise.name,
              },
              sets: exercise.sets.map((set) => {
                return {
                  rir: set.rir.toString(),
                  weight: set.weight.toString(),
                  repRange: set.repRange,
                };
              }),
            };
          }),
        };
      }),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  return (
    <>
      <div className="min-w-0 flex-1">
        <Heading>{mesocycle.name}</Heading>

        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-zinc-500">
            <CalendarDaysIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
              aria-hidden="true"
            />
            {mesocycle.durationInWeeks} weeks
          </div>
          <div className="mt-2 flex items-center text-sm text-zinc-500">
            <CalendarIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
              aria-hidden="true"
            />
            {mesocycle.trainingDays.length} days per week
          </div>
          <div className="mt-2 flex items-center text-sm text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
            </svg>
            {mesocycle.goal}
          </div>
        </div>
      </div>

      <Form method="post" className="mt-6" {...form.props}>
        <input type="hidden" name="intent" value="save-mesocycle" />

        <ul className="flex flex-wrap gap-6">
          {trainingDaysList.map((trainingDay) => (
            <li
              className="max-w-sm flex-grow rounded border border-zinc-200 bg-white sm:min-w-[18rem]"
              key={trainingDay.key}
            >
              <TrainingDayFieldset config={trainingDay} />
            </li>
          ))}
        </ul>
      </Form>

      <AddExerciseModal />
      <DeleteExerciseModal />
    </>
  );
}
