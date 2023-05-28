import { useFieldList, useForm } from "@conform-to/react";
import {
  Form,
  Link,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { ErrorPage } from "~/components/error-page";
import { requireUser } from "~/session.server";
import { parse } from "@conform-to/zod";
import { Heading } from "~/components/heading";
import {
  ArrowLongLeftIcon,
  CalendarDaysIcon,
  CalendarIcon,
} from "@heroicons/react/20/solid";
import { ErrorMessage } from "~/components/error-message";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayFieldset } from "./training-day-fieldset";
import { getMesocycle, updateMesocycle } from "~/models/mesocycle.server";
import { BackLink } from "~/components/back-link";
import type { Schema } from "./schema";
import { schema } from "./schema";
import { toast } from "react-hot-toast";
import { SuccessToast } from "~/components/success-toast";
import { useAfterPaintEffect } from "~/utils";
import { getExercisesForAutocomplete } from "~/models/exercise.server";
import { configRoutes } from "~/config-routes";

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { id } = params;
  if (!id) {
    throw new Error("id param is falsy, this should never happen");
  }

  const mesocycle = await getMesocycle(id, user.id);
  if (!mesocycle) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  const exercises = await getExercisesForAutocomplete(user.id);

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

  const { trainingDays } = submission.value;
  return updateMesocycle(new URL(request.url), id, user.id, { trainingDays });
};

export default function Mesocycle() {
  const { mesocycle } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
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
  const successId = searchParams.get("success_id");
  useAfterPaintEffect(() => {
    if (successId) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success"
            description="Your changes have been saved."
          />
        ),
        { duration: 3000, position: "bottom-center", id: successId }
      );
    }
  }, [successId]);

  return (
    <Form
      method="post"
      className="flex min-h-full flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
      {...form.props}
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
        <Link
          to={configRoutes.mesocycles.list}
          className="flex items-center gap-2 text-sm font-semibold leading-7 text-orange-600 sm:hidden"
        >
          <ArrowLongLeftIcon className="h-6 w-6" />
          <span>Go back</span>
        </Link>

        <div>
          <Heading>{mesocycle.name}</Heading>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
            <div className="mt-2 flex items-center text-sm text-zinc-500">
              <CalendarDaysIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              {mesocycle.microcycles}{" "}
              {mesocycle.microcycles === 1 ? "microcycle" : "microcycles"}
            </div>
            <div className="mt-2 flex items-center text-sm text-zinc-500">
              <CalendarIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              {mesocycle.trainingDays.length} training{" "}
              {mesocycle.trainingDays.length === 1 ? "day" : "days"} per
              microcycle
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

        <div className="sm:ml-auto">
          <SubmitButton className="whitespace-nowrap" text="Save changes" />
        </div>
      </div>

      <ol className="training-days-container mt-6 gap-6 pb-8">
        {trainingDaysList.map((trainingDay, index) => (
          <li
            className="rounded border border-zinc-200 bg-white"
            key={trainingDay.key}
          >
            <TrainingDayFieldset
              formRef={form.ref}
              dayNumber={index + 1}
              config={trainingDay}
            />
          </li>
        ))}
      </ol>
    </Form>
  );
}
