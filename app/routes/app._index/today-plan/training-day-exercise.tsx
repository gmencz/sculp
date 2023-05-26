import type { FormEvent } from "react";
import { useRef } from "react";
import { Fragment } from "react";
import { useEffect } from "react";
import { useState } from "react";
import type { CurrentMesocycleStartedData } from "../route";
import { generateId, useDebounce, useMediaQuery } from "~/utils";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import type { AddSetSchema, UpdateExerciseSchema } from "../schema";
import { addSetSchema } from "../schema";
import { actionIntents, updateExerciseSchema } from "../schema";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { Popover, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/20/solid";
import { animated, useSpring } from "@react-spring/web";
import { Textarea } from "~/components/textarea";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayExerciseSet } from "./training-day-exercise-set";
import { useDrag } from "@use-gesture/react";
import { TrainingDayExerciseSetPerformance } from "./training-day-exercise-set-performance";

type TrainingDayExerciseProps = {
  exercise: NonNullable<
    CurrentMesocycleStartedData["today"]["trainingDay"]
  >["exercises"][number];
};

export function TrainingDayExercise({ exercise }: TrainingDayExerciseProps) {
  const [updateExerciseSubmitEvent, setUpdateExerciseSubmitEvent] =
    useState<FormEvent<HTMLFormElement>>();
  const debouncedUpdateExerciseSubmitEvent = useDebounce(
    updateExerciseSubmitEvent,
    3000
  );
  const submit = useSubmit();
  const lastSubmission = useActionData();
  const [
    updateExerciseForm,
    {
      id: updateExerciseId,
      notes: updateExerciseNotes,
      actionIntent: updateExerciseActionIntent,
    },
  ] = useForm<UpdateExerciseSchema>({
    id: `exercise-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      notes: exercise.notes ?? "",
      actionIntent: actionIntents[2],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateExerciseSchema });
    },
  });

  const [
    addSetForm,
    { id: addSetId, actionIntent: addSetActionintent, setId: addSetSetId },
  ] = useForm<AddSetSchema>({
    id: `add-set-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      setId: generateId(),
      actionIntent: actionIntents[3],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: addSetSchema });
    },
  });

  const handleUpdateExerciseFormChange = (
    event: FormEvent<HTMLFormElement>
  ) => {
    setUpdateExerciseSubmitEvent(event);
  };

  useEffect(() => {
    if (debouncedUpdateExerciseSubmitEvent) {
      submit(updateExerciseForm.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [debouncedUpdateExerciseSubmitEvent, updateExerciseForm.ref, submit]);

  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));
  const [notesValue, setNotesValue] = useState(
    updateExerciseNotes.defaultValue ?? ""
  );
  const notesRef = useRef<HTMLElement>(null);

  const navigation = useNavigation();
  const isXs = useMediaQuery("(max-width: 600px)");
  const [sets, setSets] = useState(
    exercise.sets.map((s) => ({ ...s, isNew: false }))
  );

  // Optimistic UI to add a set.
  useEffect(() => {
    if (navigation.formData) {
      const actionIntent = navigation.formData.get("actionIntent");
      if (actionIntent === actionIntents[3]) {
        const id = navigation.formData.get("id");
        const setId = navigation.formData.get("setId");
        if (id === exercise.id && typeof setId === "string") {
          setSets((prevSets) => {
            const lastSet = prevSets.at(-1);

            return [
              ...prevSets,
              {
                id: setId,
                number: lastSet?.number ? lastSet.number + 1 : 1,
                repRangeLowerBound: lastSet?.repRangeLowerBound || 5,
                repRangeUpperBound: lastSet?.repRangeUpperBound || 8,
                weight: lastSet?.weight || 0,
                rir: lastSet?.rir || 0,
                completed: false,
                repsCompleted: 0,
                isNew: true,
              },
            ];
          });
        }
      }
    }
  }, [exercise.id, navigation.formData]);

  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const bind = useDrag(({ down, movement: [mx], ...rest }) => {
    // Allow dragging to the left (to delete) and only on small screens.
    if (!isXs || mx > 0) return;

    api.start({ x: down ? mx : 0, immediate: down });

    // If user drags to the left (at least half screen) and releases the drag, remove the set.
    if (Math.abs(mx) >= innerWidth / 2 && !down) {
      api.start({
        x: -innerWidth,
        immediate: false,
        onResolve: () => {
          setShowNotes(false);

          if (notesValue) {
            const formData = new FormData();
            formData.set(updateExerciseId.name, updateExerciseId.defaultValue!);
            formData.set(
              updateExerciseActionIntent.name,
              updateExerciseActionIntent.defaultValue!
            );
            formData.set(updateExerciseNotes.name, "");
            submit(formData, {
              method: "post",
              preventScrollReset: true,
              replace: true,
            });
          }
        },
      });
    }
  });

  const menuOptions = [
    {
      name: "Add notes",
      onClick: () => {
        if (showNotes) {
          if (!notesRef.current) return;

          // Focus the contenteditable notes at the end of the text.
          const range = document.createRange();
          range.selectNodeContents(notesRef.current);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          notesRef.current.focus();
        } else {
          api.start({
            x: 0,
            immediate: true,
            onResolve: () => {
              setShowNotes(true);
            },
          });
        }
      },
    },
  ];

  // TODO: Remove this, it's just for testing
  exercise.previousRun = {
    sets: [
      {
        id: generateId(),
        completed: true,
        number: 1,
        repRangeLowerBound: 5,
        repRangeUpperBound: 8,
        repsCompleted: 5,
        rir: 0,
        weight: 100,
      },
      {
        id: generateId(),
        completed: true,
        number: 2,
        repRangeLowerBound: 5,
        repRangeUpperBound: 8,
        repsCompleted: 6,
        rir: 0,
        weight: 100,
      },
      {
        id: generateId(),
        completed: true,
        number: 3,
        repRangeLowerBound: 5,
        repRangeUpperBound: 8,
        repsCompleted: 4,
        rir: 0,
        weight: 100,
      },
      {
        id: generateId(),
        completed: true,
        number: 4,
        repRangeLowerBound: 5,
        repRangeUpperBound: 8,
        repsCompleted: 4,
        rir: 0,
        weight: 100,
      },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded border-b border-zinc-200 bg-white pt-4">
      <div className="flex items-center gap-8 px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap gap-2">
          {exercise.exercise.muscleGroups.map((muscleGroup, index) => (
            <li key={muscleGroup.name}>
              <MuscleGroupBadge index={index}>
                {muscleGroup.name}
              </MuscleGroupBadge>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-4">
          <Popover className="relative flex items-center">
            <Popover.Button
              type="button"
              className="-m-1.5 rounded p-1.5 text-zinc-600 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-opacity-75"
            >
              <EllipsisVerticalIcon className="h-6 w-6" />
              <span className="sr-only">Options</span>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute right-0 top-0 z-10 -mx-4 mt-10 flex w-screen max-w-min sm:-mx-6 lg:-mx-8">
                {({ close }) => (
                  <div className="w-44 shrink rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-zinc-900 shadow-lg ring-1 ring-zinc-900/5">
                    {menuOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => {
                          close();
                          option.onClick();
                        }}
                        type="button"
                        className="block w-full text-left text-zinc-600 hover:text-orange-600"
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
      </div>

      <div className="mt-3 px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
          {exercise.exercise.name}
        </h3>
      </div>

      <Form
        preventScrollReset
        replace
        method="post"
        onChange={handleUpdateExerciseFormChange}
        {...updateExerciseForm.props}
      >
        <input {...conform.input(updateExerciseId, { hidden: true })} />
        <input
          {...conform.input(updateExerciseActionIntent, { hidden: true })}
        />

        <Transition
          show={showNotes}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="relative"
        >
          <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-4 py-1 sm:hidden">
            <TrashIcon className="h-5 w-5 text-white" />
            <span className="sr-only">Remove</span>
          </div>

          <animated.div
            {...bind()}
            className="relative cursor-grab touch-pan-y bg-white px-4 py-1 sm:cursor-auto sm:px-6 lg:px-8"
            style={{ x }}
          >
            <Textarea
              ref={notesRef}
              autoSize
              hideLabel
              hideErrorMessage
              config={updateExerciseNotes}
              label="Notes"
              onChangeValue={setNotesValue}
              placeholder="Notes"
              className="mt-2"
            />
          </animated.div>
        </Transition>
      </Form>

      {sets.length > 0 ? (
        <div role="table" className="mt-3">
          <div role="rowgroup">
            <div
              role="row"
              className="flex items-center gap-3 px-4 sm:px-6 lg:px-8"
            >
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                Weight
              </div>
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                Rep range
              </div>
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                RIR
              </div>
              <div
                role="columnheader"
                className="flex-1 text-center text-xs font-medium uppercase text-zinc-900"
              >
                Reps
              </div>

              <div role="columnheader" className="h-8 w-8" />
              <div role="columnheader" className="hidden h-8 w-8 sm:block" />
            </div>
          </div>

          <div role="rowgroup" className="flex flex-col">
            {sets.map((set, index) => (
              <TrainingDayExerciseSet
                exerciseId={exercise.id}
                setSets={setSets}
                key={set.id}
                isXs={isXs}
                index={index}
                set={set}
              />
            ))}
          </div>
        </div>
      ) : null}

      <Form
        preventScrollReset
        replace
        method="post"
        className="mt-4 px-4 sm:px-6 lg:px-8"
        {...addSetForm.props}
      >
        <input {...conform.input(addSetId, { hidden: true })} />
        <input {...conform.input(addSetActionintent, { hidden: true })} />
        <input {...conform.input(addSetSetId, { hidden: true })} />

        <SubmitButton isSubmitting={false} secondary text="Add set" />
      </Form>

      <div className="mt-2 px-4 py-4 sm:px-6 lg:px-8">
        {exercise.previousRun ? (
          <ol className="flex flex-col gap-4">
            {sets.map((set) => (
              <TrainingDayExerciseSetPerformance
                previousRunSets={exercise.previousRun?.sets || []}
                set={set}
                key={`${set.id}-performance-change`}
              />
            ))}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-zinc-900"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
            </svg>
            <p className="text-center text-sm font-medium text-zinc-900">
              Your performance is being tracked for your next session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
