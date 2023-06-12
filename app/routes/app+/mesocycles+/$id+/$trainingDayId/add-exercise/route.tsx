import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import { AppPageLayout } from "~/components/app-page-layout";
import { Heading } from "~/components/heading";
import { requireUser } from "~/services/auth/api/require-user";
import type { AddExerciseSchema, SearchSchema } from "./schema";
import { addExerciseSchema, searchSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { prisma } from "~/utils/db.server";
import {
  Form,
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import type { FieldConfig } from "@conform-to/react";
import { useForm } from "@conform-to/react";
import { useDebounce } from "~/utils/hooks";
import { Input } from "~/components/input";
import { Paragraph } from "~/components/paragraph";
import { SubmitButton } from "~/components/submit-button";
import { commitSession, getSessionFromCookie } from "~/utils/session.server";
import { toPostgresQuery } from "~/utils/strings";

export const handle = {
  header: () => "Add exercise",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (query) {
    const formData = new FormData();
    formData.set("query", query);
    const submission = parse(formData, { schema: searchSchema });
    if (!submission.value || submission.intent !== "submit") {
      return json(
        { exercises: [], noResults: false, submission },
        { status: 400 }
      );
    }
  }

  let formattedQuery;
  if (query) {
    formattedQuery = toPostgresQuery(query);
  }

  const exercises = await prisma.exercise.findMany({
    where: formattedQuery
      ? {
          AND: [
            {
              OR: [{ userId: user.id }, { shared: true }],
            },
            {
              OR: [
                { name: { search: formattedQuery } },
                {
                  muscleGroups: { some: { name: { search: formattedQuery } } },
                },
              ],
            },
          ],
        }
      : {
          OR: [{ userId: user.id }, { shared: true }],
        },
    select: {
      id: true,
      name: true,
      userId: true,
      shared: true,
      muscleGroups: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return json({
    exercises,
    noResults: exercises.length === 0 && Boolean(query),
    submission: null,
  });
};

export const action = async ({ request, params }: ActionArgs) => {
  await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema: addExerciseSchema });
  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { id } = submission.value;
  const { trainingDayId, id: mesocycleId } = params;
  if (!trainingDayId || !mesocycleId) {
    throw new Error(
      "trainingDayId or mesocycleId is falsy, this shouldn't happen"
    );
  }

  const lastCurrentExercise =
    await prisma.mesocycleTrainingDayExercise.findFirst({
      where: {
        mesocycleTrainingDayId: trainingDayId,
      },
      orderBy: {
        number: "desc",
      },
      select: {
        number: true,
      },
    });

  await prisma.mesocycleTrainingDay.update({
    where: {
      id: trainingDayId,
    },
    data: {
      exercises: {
        create: {
          exercise: { connect: { id } },
          number: lastCurrentExercise ? lastCurrentExercise.number + 1 : 1,
        },
      },
    },
  });

  const session = await getSessionFromCookie(request);
  session.flash("scrollToBottom", true);
  return redirect(`/app/mesocycles/${mesocycleId}/${trainingDayId}`, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

export default function AddExercise() {
  const { exercises, noResults, submission } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [isValidQuery, setIsValidQuery] = useState(true);
  const [searchForm, { query: queryConfig }] = useForm<SearchSchema>({
    id: "search-exercises",
    defaultValue: {
      query: searchParams.get("query") ?? "",
    },
    shouldValidate: "onInput",
    lastSubmission: submission ?? undefined,
    onValidate({ formData }) {
      const result = parse(formData, { schema: searchSchema });
      if (Object.keys(result.error).length) {
        setIsValidQuery(false);
      } else {
        setIsValidQuery(true);
      }

      return result;
    },
  });

  const lastSubmission = useActionData() as any;
  const [form, { id: idConfig }] = useForm<AddExerciseSchema>({
    id: "add-exercise",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: addExerciseSchema });
    },
  });

  const submit = useSubmit();
  const [query, setQuery] = useState(queryConfig.defaultValue!);
  const lastQueryRef = useRef(query);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery !== lastQueryRef.current) {
      lastQueryRef.current = debouncedQuery;
      if (isValidQuery) {
        submit(searchForm.ref.current);
      }
    }
  }, [debouncedQuery, isValidQuery, searchForm.ref, submit]);

  return (
    <AppPageLayout>
      <Heading className="hidden text-zinc-900 lg:block">Add exercise</Heading>

      <>
        {exercises.length > 0 || noResults ? (
          <Form className="lg:mt-4" method="get" {...searchForm.props}>
            <Input
              config={queryConfig}
              label="Quick search"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </Form>
        ) : null}

        {exercises.length > 0 ? (
          <Form
            replace
            className="-mx-4 mt-4 sm:-mx-0"
            method="delete"
            {...form.props}
          >
            <div className="relative">
              <table className="min-w-full divide-y divide-zinc-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-0"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="hidden px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 lg:table-cell"
                    >
                      Muscles
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-0"
                    >
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-zinc-50">
                  {exercises.map((exercise, index) => (
                    <ExerciseRow
                      config={idConfig}
                      index={index}
                      key={exercise.id}
                      exercise={exercise}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Form>
        ) : noResults ? (
          <>
            <Paragraph className="mt-4">
              We couldn't find any exercises that match your search.
            </Paragraph>
          </>
        ) : null}
      </>
    </AppPageLayout>
  );
}

type ExerciseRowProps = {
  index: number;
  config: FieldConfig<string>;
  exercise: {
    id: string;
    name: string;
    userId: string | null;
    shared: boolean;
    muscleGroups: {
      id: string;
      name: string;
    }[];
  };
};

function ExerciseRow({ exercise, index, config }: ExerciseRowProps) {
  const formattedMuscleGroups = exercise.muscleGroups
    .map((m) => m.name)
    .join(", ");

  return (
    <tr>
      <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 sm:w-auto sm:max-w-none sm:pl-0">
        {exercise.name}
        <dl className="font-normal lg:hidden">
          <dt className="sr-only">Muscles</dt>
          <dd className="mt-1 truncate text-zinc-700">
            {formattedMuscleGroups}
          </dd>
        </dl>
      </td>
      <td className="hidden px-3 py-4 text-sm text-zinc-500 lg:table-cell">
        {formattedMuscleGroups}
      </td>

      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
        <SubmitButton name={config.name} value={exercise.id} text="Add" />
      </td>
    </tr>
  );
}
