import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import { Exercise } from "./exercise";

type SortableExerciseProps = {
  exercise: SerializeFrom<typeof loader>["trainingDay"]["exercises"][number];
};

export function SortableExercise({ exercise }: SortableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Exercise
      exercise={exercise}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
}
