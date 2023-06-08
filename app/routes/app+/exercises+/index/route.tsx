import { useForm } from "@conform-to/react";
import { Prisma } from "@prisma/client";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { configRoutes } from "~/utils/routes";
import type { Schema, SearchSchema } from "./schema";
import { searchSchema } from "./schema";
import { schema } from "./schema";
import { parse } from "@conform-to/zod";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { Fragment } from "react";
import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ErrorMessage } from "~/components/error-message";
import { AppPageLayout } from "~/components/app-page-layout";
import { Input } from "~/components/input";
import { classes } from "~/utils/classes";
import { prisma } from "~/utils/db.server";
import { requireUser } from "~/services/auth/api/require-user";
import { useDebounce } from "~/utils/hooks";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";
import { LockClosedIcon } from "@heroicons/react/20/solid";

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
    formattedQuery = query
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" | ");
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

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });
  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { deleteExercisesIds } = submission.value;

  try {
    await prisma.exercise.deleteMany({
      where: {
        AND: [
          { shared: false },
          { userId: user.id },
          { id: { in: deleteExercisesIds.filter(Boolean) } },
        ],
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        submission.error["deleteExercisesIds"] =
          "Some of the selected exercises could not be deleted because they are linked to one or more of your mesocycles.";

        return json(submission, { status: 400 });
      }
    }

    throw error;
  }

  const updatedSession = await flashGlobalNotification(request, {
    type: "success",
    message:
      deleteExercisesIds.length > 1
        ? "The selected exercises have been deleted."
        : "The selected exercise has been deleted.",
  });

  return redirect(configRoutes.app.exercises.list, {
    headers: {
      "Set-Cookie": await commitSession(updatedSession),
    },
  });
};

export default function Exercises() {
  const { exercises, submission, noResults } = useLoaderData<typeof loader>();
  const allExercisesIds = useMemo(
    () => exercises.filter((e) => Boolean(e.userId)).map((e) => e.id),
    [exercises]
  );
  const checkbox = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [selectedExercisesIds, setSelectedExercisesIds] = useState<string[]>(
    []
  );
  const lastSubmission = useActionData() as any;
  const [form, { deleteExercisesIds: deleteExercisesIdsConfig }] =
    useForm<Schema>({
      id: "delete-exercises",
      lastSubmission,
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  const isSubmitting = useNavigation().state === "submitting";

  function toggleAll() {
    setSelectedExercisesIds(checked ? [] : allExercisesIds);
    setChecked(!checked);
  }

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

  // Unselect exercises when exercises change.
  useEffect(() => {
    setSelectedExercisesIds([]);
  }, [exercises]);

  const canDeleteExercises = exercises.some((exercise) => !exercise.shared);

  return (
    <AppPageLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading>Exercises</Heading>

          {exercises.length > 0 || noResults ? (
            <Paragraph className="mt-1">
              A list of all exercises including their name and muscle groups
              worked. There's some exercises that are read only because they are
              shared by all Sculped users.
            </Paragraph>
          ) : (
            <Paragraph className="mt-1">
              You don't have any exercises yet, go ahead and add some!
            </Paragraph>
          )}

          {deleteExercisesIdsConfig.error ? (
            <ErrorMessage>{deleteExercisesIdsConfig.error}</ErrorMessage>
          ) : null}
        </div>
        <div className="mb-6 mt-4 sm:mb-0 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to={configRoutes.app.exercises.new}
            className={clsx(classes.buttonOrLink.primary, "block w-full")}
          >
            New exercise
          </Link>
        </div>
      </div>

      <>
        {exercises.length > 0 || noResults ? (
          <Form className="mt-4" method="get" {...searchForm.props}>
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
              {canDeleteExercises ? (
                <div
                  className={clsx(
                    "absolute left-14 top-0 h-12 items-center space-x-3 bg-white sm:left-12",
                    selectedExercisesIds.length > 0 ? "flex" : "hidden"
                  )}
                >
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="inline-flex items-center rounded bg-white px-2 py-1 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                  >
                    Delete selected
                  </button>
                </div>
              ) : null}

              <table className="min-w-full divide-y divide-zinc-300">
                <thead>
                  <tr>
                    <th scope="col" className="relative px-6 sm:w-12">
                      {canDeleteExercises ? (
                        <input
                          id="toggle-all"
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-600"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                      ) : null}
                    </th>

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
                      index={index}
                      formId={form.id!}
                      configName={deleteExercisesIdsConfig.name}
                      key={exercise.id}
                      exercise={exercise}
                      selected={selectedExercisesIds}
                      setSelected={setSelectedExercisesIds}
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
  selected: string[];
  formId: string;
  configName: string;
  setSelected: Dispatch<SetStateAction<string[]>>;
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

function ExerciseRow({
  exercise,
  selected,
  setSelected,
  formId,
  configName,
  index,
}: ExerciseRowProps) {
  const isSelected = useMemo(
    () => selected.includes(exercise.id),
    [exercise.id, selected]
  );

  const formattedMuscleGroups = exercise.muscleGroups
    .map((m) => m.name)
    .join(", ");

  return (
    <tr>
      <td className="relative px-6 sm:w-12">
        {isSelected ? (
          <div className="absolute inset-y-0 left-0 w-0.5 bg-orange-600" />
        ) : null}

        {exercise.shared ? (
          <LockClosedIcon className="-mx-2 h-4 w-4 text-zinc-600" />
        ) : (
          <>
            <input
              type="hidden"
              form={formId}
              id={`${formId}-${configName}[${index}]`}
              name={`${configName}[${index}]`}
              value={isSelected ? exercise.id : ""}
              aria-hidden="true"
            />

            <input
              id={`select-${exercise.id}`}
              type="checkbox"
              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-600"
              checked={isSelected}
              onChange={(e) => {
                setSelected(
                  e.target.checked
                    ? [...selected, exercise.id]
                    : selected.filter((id) => id !== exercise.id)
                );
              }}
            />
          </>
        )}
      </td>

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

      {exercise.shared ? (
        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium text-zinc-600 sm:pr-0">
          Read only
        </td>
      ) : (
        <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
          <Link
            to={`./${exercise.id}`}
            className={classes.buttonOrLink.textOnly}
          >
            Edit<span className="sr-only">, {exercise.name}</span>
          </Link>
        </td>
      )}
    </tr>
  );
}
