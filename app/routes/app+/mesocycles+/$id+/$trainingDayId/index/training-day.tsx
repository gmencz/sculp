import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import type { action } from "./route";
import { type loader } from "./route";
import { conform, useForm } from "@conform-to/react";
import type { UpdateTrainingDaySchema } from "./schema";
import { actionIntents, updateTrainingDaySchema } from "./schema";
import { parse } from "@conform-to/zod";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "~/utils/hooks";
import { getUniqueMuscleGroups } from "~/utils/muscle-groups";
import { Heading } from "~/components/heading";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { Input } from "~/components/input";
import { TrainingDayExercise } from "./training-day-exercise";
import clsx from "clsx";
import { classes } from "~/utils/classes";

export function TrainingDay() {
  const { trainingDay, scrollToBottom } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const lastSubmission = useActionData<typeof action>();
  const [form, { label, actionIntent }] = useForm<UpdateTrainingDaySchema>({
    id: "update-label-form",
    lastSubmission,
    defaultValue: {
      label: trainingDay.label,
      actionIntent: actionIntents[4],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateTrainingDaySchema });
    },
  });

  const [submitEvent, setSubmitEvent] = useState<FormEvent<HTMLFormElement>>();
  const debouncedSubmitEvent = useDebounce(submitEvent, 1500);

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    setSubmitEvent(event);
  };

  useEffect(() => {
    if (debouncedSubmitEvent) {
      submit(form.ref.current, {
        replace: true,
      });
    }
  }, [submit, debouncedSubmitEvent, form.ref]);

  const muscleGroups = useMemo(
    () => getUniqueMuscleGroups(trainingDay),
    [trainingDay]
  );

  const exercisesListEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollToBottom) {
      exercisesListEndRef.current?.scrollIntoView();
    }
  }, [scrollToBottom]);

  return (
    <>
      <div className="bg-zinc-900 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-1 hidden items-center justify-between lg:flex">
            <h2 className="font-medium text-zinc-200">
              {trainingDay.mesocycle?.name}
            </h2>
          </div>

          <Heading className="text-white">
            {trainingDay.label || "Unlabelled"}
          </Heading>

          {muscleGroups.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {muscleGroups.map((muscleGroup, index) => (
                <li key={muscleGroup}>
                  <MuscleGroupBadge white index={index}>
                    {muscleGroup}
                  </MuscleGroupBadge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mt-4 pb-8">
        <Form
          method="post"
          onChange={handleFormChange}
          replace
          className="px-4 sm:px-6 lg:px-8"
          {...form.props}
        >
          <div className="mx-auto w-full max-w-2xl">
            <input {...conform.input(actionIntent, { hidden: true })} />
            <Input label="Label" config={label} />
          </div>
        </Form>

        <ol className="mt-6 flex flex-col gap-6">
          {trainingDay.exercises.map((exercise) => (
            <li key={exercise.id}>
              <TrainingDayExercise exercise={exercise} />
            </li>
          ))}
        </ol>

        <div ref={exercisesListEndRef} />

        <div
          className={clsx(
            "px-4 sm:px-6 lg:px-8",
            trainingDay.exercises.length > 0 && "mt-4"
          )}
        >
          <div className="mx-auto w-full max-w-2xl">
            <Link
              to="./add-exercise"
              className={clsx(classes.buttonOrLink.secondary, "w-full")}
            >
              Add exercise
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
