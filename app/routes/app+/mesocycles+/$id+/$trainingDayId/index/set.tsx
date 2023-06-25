import { Transition } from "@headlessui/react";
import { TrashIcon } from "@heroicons/react/20/solid";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useRef, useState } from "react";
import { useSubmit } from "@remix-run/react";
import { TrainingDayExerciseSetForm } from "./set-form";

export type Set = {
  isNew: boolean;
  number: number;
  id: string;
  weight: number | null;
  rir: number;
  repRangeLowerBound: number;
  repRangeUpperBound: number;
};

type TrainingDayExerciseSetProps = {
  set: Set;
  setSets: React.Dispatch<React.SetStateAction<Set[]>>;
  index: number;
  isXs: boolean;
  exerciseId: string;
};

export function TrainingDayExerciseSet({
  set,
  index,
  isXs,
  setSets,
  exerciseId,
}: TrainingDayExerciseSetProps) {
  const [isRemoved, setIsRemoved] = useState(false);
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
          setIsRemoved(true);
        },
      });
    }
  });

  const submit = useSubmit();
  const removeFormRef = useRef<HTMLFormElement>(null);

  return (
    <Transition
      show={!isRemoved}
      appear={set.isNew}
      unmount={false}
      afterLeave={() => {
        if (isXs) {
          // If XS screen, we need to submit the form to delete the set, on XS+ we don't because this button is visible.
          submit(removeFormRef.current, {
            replace: true,
            preventScrollReset: true,
          });
        }

        setSets((prevSets) => prevSets.filter(({ id }) => id !== set.id));
      }}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 -translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className="relative transition"
    >
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-4 py-1 dark:bg-red-800 sm:hidden">
        <TrashIcon className="h-5 w-5 text-white" />
        <span className="sr-only">Remove</span>
      </div>

      <animated.div
        {...bind()}
        role="row"
        aria-rowindex={index}
        className="relative cursor-grab touch-pan-y bg-white px-4 py-1 dark:bg-zinc-950 sm:cursor-auto sm:px-6 lg:px-8"
        style={{ x }}
      >
        <TrainingDayExerciseSetForm
          exerciseId={exerciseId}
          removeFormRef={removeFormRef}
          set={set}
          isRemoved={isRemoved}
          setIsRemoved={setIsRemoved}
          setSets={setSets}
        />
      </animated.div>
    </Transition>
  );
}
