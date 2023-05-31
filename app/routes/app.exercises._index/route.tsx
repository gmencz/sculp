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
import { configRoutes } from "~/config-routes";
import { deleteExercises, getExercises } from "~/models/exercise.server";
import { requireUser } from "~/session.server";
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
import { generateId, useAfterPaintEffect, useDebounce } from "~/utils";
import { toast } from "react-hot-toast";
import { SuccessToast } from "~/components/success-toast";
import { AppPageLayout } from "~/components/app-page-layout";
import { Input } from "~/components/input";

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

  const exercises = await getExercises(user.id, query);
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
    await deleteExercises(deleteExercisesIds.filter(Boolean), user.id);
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

  const url = new URL(request.url);
  url.searchParams.set("success_id", generateId());

  return redirect(configRoutes.exercises.list + url.search);
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
  const lastSubmission = useActionData();
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
  const successId = searchParams.get("success_id");
  useAfterPaintEffect(() => {
    if (successId) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success"
            description="The selected exercises were deleted."
          />
        ),
        { duration: 3000, position: "bottom-center", id: successId }
      );
    }
  }, [successId]);

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

  return (
    <AppPageLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading>Exercises</Heading>

          <Paragraph className="mt-1">
            A list of your exercises including their name and muscle groups
            worked.
          </Paragraph>

          {deleteExercisesIdsConfig.error ? (
            <ErrorMessage>{deleteExercisesIdsConfig.error}</ErrorMessage>
          ) : null}
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to={configRoutes.exercises.new}
            className="block rounded-md bg-orange-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            New exercise
          </Link>
        </div>
      </div>

      <>
        <Form className="mt-4" method="get" {...searchForm.props}>
          <Input
            config={queryConfig}
            label="Quick search"
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </Form>

        {exercises.length > 0 ? (
          <Form className="-mx-4 mt-4 sm:-mx-0" method="delete" {...form.props}>
            <div className="relative">
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

              <table className="min-w-full divide-y divide-zinc-300">
                <thead>
                  <tr>
                    <th scope="col" className="relative px-6 sm:w-12">
                      <input
                        id="toggle-all"
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-600"
                        ref={checkbox}
                        checked={checked}
                        onChange={toggleAll}
                      />
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

        {exercise.userId ? (
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
        ) : null}
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

      {/* Only show edit link if the exercise was created by the user */}
      {exercise.userId ? (
        <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
          <Link
            to={`./${exercise.id}`}
            className="text-orange-600 hover:text-orange-900"
          >
            Edit<span className="sr-only">, {exercise.name}</span>
          </Link>
        </td>
      ) : null}
    </tr>
  );
}
