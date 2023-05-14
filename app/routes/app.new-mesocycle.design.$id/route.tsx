import { Form, useActionData, useLoaderData } from "@remix-run/react";
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
import { createMesocycle, getDraftMesocycle } from "~/models/mesocycle.server";
import { configRoutes } from "~/config-routes";
import { Heading } from "~/components/heading";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { SubmitButton } from "~/components/submit-button";
import { ErrorMessage } from "~/components/error-message";

export const action = async ({ request, params }: ActionArgs) => {
  return createMesocycle(request, params);
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

export const schema = z.object({
  trainingDays: z.array(
    z.object({
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
            sets: z
              .array(
                z.object({
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
                    .refine(
                      (data) => {
                        // Format: 5-8
                        if (data.length !== 3 || data[1] !== "-") {
                          return false;
                        }

                        const lowerBound = Number(data[0]);
                        const upperBound = Number(data[2]);
                        if (
                          Number.isNaN(lowerBound) ||
                          Number.isNaN(upperBound)
                        ) {
                          return false;
                        }

                        if (lowerBound >= upperBound) {
                          return false;
                        }

                        return true;
                      },
                      { message: "The rep range is not valid." }
                    ),
                }),
                { required_error: "You must add at least 1 set." }
              )
              .min(1, `You must add at least 1 set.`)
              .max(10, `The sets must be at most 10.`),

            id: z
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

            dayNumber: z.coerce
              .number({
                invalid_type_error: "The day number is not valid.",
                required_error: "The day number is required.",
              })
              .min(1, `The day number must be at least 1.`)
              .max(6, `The day number can't be greater than 6.`),
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
  const lastSubmission = useActionData();
  const [form, { trainingDays }] = useForm<Schema>({
    id: "save-mesocycle",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
    defaultValue: {
      trainingDays: Array.from(
        { length: mesocycle.trainingDaysPerWeek },
        (_, index) => ({
          dayNumber: (index + 1).toString(),
          exercises: [],
        })
      ),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  return (
    <>
      <Form
        method="post"
        {...form.props}
        className="flex min-h-full flex-col py-10"
      >
        <input type="hidden" name="intent" value="save-mesocycle" />

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
                {mesocycle.trainingDaysPerWeek} days per week
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

            {!lastSubmission?.error.form ? (
              <div className="mt-5">
                <ErrorMessage>{lastSubmission?.error.form}</ErrorMessage>
              </div>
            ) : null}
          </div>

          <div className="ml-auto">
            <SubmitButton text="Save and contine" />
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
    </>
  );
}
