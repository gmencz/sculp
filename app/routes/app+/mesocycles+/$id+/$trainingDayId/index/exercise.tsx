import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import type { CSSProperties } from "react";
import { Fragment, forwardRef, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "~/utils/hooks";
import { Link, useNavigation, useSubmit } from "@remix-run/react";
import { ActionIntents } from "./schema";
import { useSpring } from "@react-spring/web";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { Popover, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { TrainingDayExerciseSet } from "./set";
import { AddSetForm } from "./add-set-form";
import { RemoveExerciseForm } from "./remove-exercise-form";
import { UpdateExerciseNotesForm } from "./update-exercise-notes-form";
import { configRoutes } from "~/utils/routes";

type ExerciseProps = {
  exercise: SerializeFrom<typeof loader>["trainingDay"]["exercises"][number];
  style?: CSSProperties;
  asDiv?: boolean;
};

export const Exercise = forwardRef<HTMLDivElement, ExerciseProps>(
  ({ exercise, asDiv, ...props }, ref) => {
    const submit = useSubmit();
    const navigation = useNavigation();
    const isXs = useMediaQuery("(max-width: 600px)");
    const [sets, setSets] = useState(
      exercise.sets.map((s) => ({ ...s, isNew: false }))
    );

    useEffect(() => {
      if (navigation.formData) {
        const actionIntent = navigation.formData.get("actionIntent");
        if (actionIntent === ActionIntents.AddSet) {
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

    const [isRemoved, setIsRemoved] = useState(false);
    const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));
    const notesRef = useRef<HTMLElement>(null);
    const [{ x: notesX }, notesApi] = useSpring(() => ({ x: 0 }));

    const menuOptions = [
      {
        name: "View exercise",
        to: configRoutes.app.exercises.view(exercise.exercise!.id),
      },
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
            notesApi.start({
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
          setIsRemoved(true);
        },
      },
    ];

    const removeExerciseFormRef = useRef<HTMLFormElement>(null);

    return (
      <Transition
        show={!isRemoved}
        as={asDiv ? "div" : "li"}
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        afterLeave={() => {
          submit(removeExerciseFormRef.current, {
            replace: true,
            preventScrollReset: true,
          });
        }}
        className="mx-auto w-full max-w-2xl bg-white pb-6 shadow dark:bg-zinc-950 sm:rounded-lg"
      >
        <RemoveExerciseForm
          exercise={exercise}
          formRef={removeExerciseFormRef}
        />

        <div ref={ref} className="px-4 pb-3 pt-6 sm:px-6 lg:px-8" {...props}>
          <div className="mx-auto flex w-full max-w-2xl items-center gap-8">
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
                  className="-m-1.5 rounded p-1.5 text-zinc-600 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-opacity-75 dark:text-zinc-300 dark:hover:text-zinc-200"
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
                      <ul className="flex w-44 shrink flex-col gap-4 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-zinc-900 shadow-lg ring-1 ring-zinc-900/5 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-50/10">
                        {menuOptions.map((option) => (
                          <li key={option.name}>
                            {option.to ? (
                              <Link
                                to={option.to}
                                className="block w-full text-left text-zinc-900 hover:text-orange-600 dark:text-zinc-50"
                              >
                                {option.name}
                              </Link>
                            ) : (
                              <button
                                onClick={() => {
                                  close();
                                  option.onClick?.();
                                }}
                                type="button"
                                className="block w-full text-left text-zinc-900 hover:text-orange-600 dark:text-zinc-50"
                              >
                                {option.name}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Popover.Panel>
                </Transition>
              </Popover>
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold leading-7 text-zinc-900 dark:text-zinc-50 sm:truncate sm:text-2xl sm:tracking-tight">
            {exercise.exercise?.name}
          </h3>
        </div>

        <UpdateExerciseNotesForm
          exercise={exercise}
          isXs={isXs}
          x={notesX}
          springApi={notesApi}
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          ref={notesRef}
        />

        {sets.length > 0 ? (
          <div role="table">
            <div role="rowgroup" className="px-4 sm:px-6 lg:px-8">
              <div
                role="row"
                className="mx-auto flex h-8 w-full max-w-2xl items-center gap-3"
              >
                <div
                  role="columnheader"
                  className="flex-1 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50"
                >
                  Weight
                </div>
                <div
                  role="columnheader"
                  className="flex-1 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50"
                >
                  Rep range
                </div>
                <div
                  role="columnheader"
                  className="flex-1 text-center text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50"
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

        <AddSetForm exercise={exercise} />
      </Transition>
    );
  }
);
