import { useFieldList, useForm } from "@conform-to/react";
import {
  Form,
  Link,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import { ErrorPage } from "~/components/error-page";
import { configRoutes } from "~/config-routes";
import { requireUser } from "~/session.server";
import { parse } from "@conform-to/zod";
import { z } from "zod";
import { Heading } from "~/components/heading";
import { CalendarDaysIcon, CalendarIcon } from "@heroicons/react/20/solid";
import { ErrorMessage } from "~/components/error-message";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { prisma } from "~/db.server";
import { getMesocycle, updateMesocycle } from "~/models/mesocycle.server";
import { validateRepRange } from "~/utils";
import { BackLink } from "~/components/back-link";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    return redirect(configRoutes.mesocycles);
  }

  const mesocycle = await getMesocycle(id, user.id);
  if (!mesocycle) {
    throw new Response("Not Found", {
      status: 404,
    });
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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorPage
        statusCode={error.status}
        title="Mesocycle not found"
        subtitle={`We couldn't find the mesocycle you were looking for. So sorry.`}
        action={<BackLink to="/app">Back to your mesocycles</BackLink>}
      />
    );
  }

  throw error;
}

export const schema = z.object({
  trainingDays: z.array(
    z.object({
      id: z
        .string({
          invalid_type_error: "The day id is not valid.",
          required_error: "The day id is required.",
        })
        .min(1, "The day id is required.")
        .max(25, "The day id must be at most 25 characters long."),

      label: z
        .string({
          invalid_type_error: "The label is not valid.",
          required_error: "The label is required.",
        })
        .min(1, "The label is required.")
        .max(50, "The label must be at most 50 characters long."),

      exercises: z
        .array(
          z.object({
            id: z
              .string({
                invalid_type_error: "The exercise id is not valid.",
              })
              .max(25, "The exercise id must be at most 25 characters long.")
              .nullable(),

            sets: z
              .array(
                z.object({
                  id: z
                    .string({
                      invalid_type_error: "The set id is not valid.",
                    })
                    .max(25, "The set id must be at most 25 characters long.")
                    .nullable(),

                  rir: z.coerce
                    .number({
                      invalid_type_error: "The RIR is not valid.",
                      required_error: "The RIR is required.",
                    })
                    .min(0, `The RIR can't be lower than 0.`)
                    .max(100, `The RIR can't be higher than 100.`),

                  weight: z.coerce
                    .number({
                      invalid_type_error: "The weight is not valid.",
                      required_error: "The weight is required.",
                    })
                    .min(1, `The weight must be greater than 0.`)
                    .max(10000, `The weight can't be greater than 10000.`),

                  repRange: z
                    .string({
                      invalid_type_error: "The rep range is not valid.",
                      required_error: "The rep range is required.",
                    })
                    .min(1, "The rep range is required.")
                    .refine(validateRepRange, {
                      message: "The rep range is not valid.",
                    }),
                }),
                { required_error: "You must add at least 1 set." }
              )
              .min(1, `You must add at least 1 set.`)
              .max(10, `The sets must be at most 10.`),

            searchedExerciseId: z
              .string({
                invalid_type_error: "The exercise is not valid.",
                required_error: "The exercise is required.",
              })
              .min(1, "The exercise is required."),

            notes: z
              .string({
                invalid_type_error: "The notes are not valid.",
              })
              .optional(),
          }),
          {
            required_error: "You must add at least 1 exercise.",
          }
        )
        .min(1, "You must add at least 1 exercise.")
        .max(
          8,
          "You can't add more than 7 exercises on a given day, this is to prevent junk volume."
        ),
    })
  ),
});

export type Schema = z.TypeOf<typeof schema>;

export const action = async ({ request, params }: ActionArgs) => {
  return updateMesocycle(request, params);
};

export default function Mesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData();
  const [form, { trainingDays }] = useForm<Schema>({
    id: "edit-mesocycle",
    lastSubmission,
    noValidate: true,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      trainingDays: mesocycle.trainingDays.map((trainingDay) => ({
        id: trainingDay.id,
        label: trainingDay.label,
        exercises: trainingDay.exercises.map((exercise) => ({
          id: exercise.id,
          searchedExerciseId: exercise.exercise.id,
          notes: exercise.notes ?? undefined,
          sets: exercise.sets.map((set) => ({
            id: set.id,
            repRange: `${set.repRangeLowerBound}-${set.repRangeUpperBound}`,
            weight: set.weight.toString(),
            rir: set.rir.toString(),
          })),
        })),
      })),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  return (
    <Form
      method="post"
      className="flex min-h-full flex-col py-10"
      {...form.props}
    >
      <div className="flex min-w-0 flex-col sm:flex-row">
        <div>
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

          {lastSubmission?.error.form ? (
            <div className="mt-5">
              <ErrorMessage>{lastSubmission?.error.form}</ErrorMessage>
            </div>
          ) : null}
        </div>

        <div className="ml-auto">
          <SubmitButton text="Save changes" />
        </div>
      </div>

      <ul className="mt-6 flex flex-1 gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-track-zinc-100 scrollbar-thumb-zinc-900 scrollbar-thumb-rounded">
        {trainingDaysList.map((trainingDay, index) => (
          <li
            className="min-w-full max-w-sm flex-1 rounded border border-zinc-200 bg-white xs:min-w-[26rem]"
            key={trainingDay.key}
          >
            <TrainingDayFieldset
              formRef={form.ref}
              dayNumber={index + 1}
              config={trainingDay}
            />
          </li>
        ))}
      </ul>
    </Form>
  );
}
