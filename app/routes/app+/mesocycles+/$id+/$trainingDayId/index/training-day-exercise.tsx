import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import type { FormEvent } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useDebounce, useMediaQuery } from "~/utils/hooks";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import type {
  AddSetSchema,
  RemoveExerciseSchema,
  UpdateExerciseSchema,
} from "./schema";
import {
  actionIntents,
  addSetSchema,
  removeExerciseSchema,
  updateExerciseSchema,
} from "./schema";
import { parse } from "@conform-to/zod";
import { generateId } from "~/utils/ids";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { Popover, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, TrashIcon } from "@heroicons/react/20/solid";
import { Textarea } from "~/components/textarea";
import { TrainingDayExerciseSet } from "./training-day-exercise-set";
import { SubmitButton } from "~/components/submit-button";

type TrainingDayExerciseProps = {
  exercise: SerializeFrom<typeof loader>["trainingDay"]["exercises"][number];
};

export function TrainingDayExercise({ exercise }: TrainingDayExerciseProps) {
  const [updateExerciseSubmitEvent, setUpdateExerciseSubmitEvent] =
    useState<FormEvent<HTMLFormElement>>();

  const debouncedUpdateExerciseSubmitEvent = useDebounce(
    updateExerciseSubmitEvent,
    3000
  );

  const submit = useSubmit();

  const lastSubmission = useActionData() as any;

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
      actionIntent: actionIntents[2],
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
      if (actionIntent === actionIntents[2]) {
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
                weight: lastSet?.weight || null,
                rir: lastSet?.rir || 0,
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

  const [
    removeExerciseForm,
    { id: removeExerciseId, actionIntent: removeExerciseActionIntent },
  ] = useForm<RemoveExerciseSchema>({
    id: `remove-${exercise.id}`,
    lastSubmission,
    defaultValue: {
      id: exercise.id,
      actionIntent: actionIntents[3],
    },
    onValidate({ formData }) {
      return parse(formData, { schema: removeExerciseSchema });
    },
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
    {
      name: "Remove exercise",
      onClick: () => {
        submit(removeExerciseForm.ref.current, {
          replace: true,
          preventScrollReset: true,
        });
      },
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Form
        preventScrollReset
        replace
        method="delete"
        {...removeExerciseForm.props}
      >
        <input {...conform.input(removeExerciseId, { hidden: true })} />
        <input
          {...conform.input(removeExerciseActionIntent, { hidden: true })}
        />
      </Form>

      <div className="flex items-center gap-8 px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap gap-2">
          {exercise.exercise?.muscleGroups.map((muscleGroup, index) => (
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
                  <ul className="flex w-44 shrink flex-col gap-4 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-zinc-900 shadow-lg ring-1 ring-zinc-900/5">
                    {menuOptions.map((option) => (
                      <li key={option.name}>
                        <button
                          onClick={() => {
                            close();
                            option.onClick();
                          }}
                          type="button"
                          className="block w-full text-left text-zinc-900 hover:text-orange-600"
                        >
                          {option.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
      </div>

      <div className="mt-3 px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-2xl sm:tracking-tight">
          {exercise.exercise?.name}
        </h3>
      </div>

      <Form
        preventScrollReset
        replace
        method="post"
        onChange={handleUpdateExerciseFormChange}
        className="px-4 sm:px-6 lg:px-8"
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
            className="relative cursor-grab touch-pan-y bg-zinc-50 py-1 sm:cursor-auto"
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
          <div role="rowgroup" className="px-4 sm:px-6 lg:px-8">
            <div role="row" className="flex h-8 items-center gap-3">
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

        <SubmitButton
          isSubmitting={false}
          secondary
          className="w-full ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
          text="Add set"
        />
      </Form>
    </div>
  );
}
