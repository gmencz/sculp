import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars2Icon } from "@heroicons/react/20/solid";

type SortableExerciseProps = {
  exercise: SerializeFrom<typeof loader>["routine"]["exercises"][number];
};

export function SortableExercise({ exercise }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl font-medium uppercase dark:bg-zinc-800">
          {exercise.exercise.name.charAt(0)}
        </span>

        <div className="flex flex-col">{exercise.exercise.name}</div>

        <Bars2Icon className="ml-auto h-6 w-6 text-zinc-400" />
      </div>
    </li>
  );
}
