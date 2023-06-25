import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import type { action } from "./route";
import { type loader } from "./route";
import { Fragment, useEffect, useRef, useState } from "react";
import { getUniqueMuscleGroups } from "~/utils/muscle-groups";
import { Heading } from "~/components/heading";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import clsx from "clsx";
import { classes } from "~/utils/classes";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReorderExercisesSchema } from "./schema";
import { ActionIntents, reorderExercisesSchema } from "./schema";
import { useDebounce } from "~/utils/hooks";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { TrainingDayLabelForm } from "./update-training-day-label-form";
import { SortableExercise } from "./sortable-exercise";
import { Exercise } from "./exercise";
import { generateId } from "~/utils/ids";

export function TrainingDay() {
  const { trainingDay, scrollToBottom } = useLoaderData<typeof loader>();

  const exercisesListEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollToBottom) {
      exercisesListEndRef.current?.scrollIntoView();
    }
  }, [scrollToBottom]);

  const [exercises, setExercises] = useState(trainingDay.exercises);
  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.formData) {
      const actionIntent = navigation.formData.get("actionIntent");
      if (actionIntent === ActionIntents.RemoveExercise) {
        const id = navigation.formData.get("id");
        setExercises((exercises) =>
          exercises.filter((exercise) => exercise.id !== id)
        );
      }
    }
  }, [navigation.formData]);

  const [muscleGroups, setMuscleGroups] = useState(() =>
    getUniqueMuscleGroups(exercises)
  );

  useEffect(() => {
    setMuscleGroups(getUniqueMuscleGroups(exercises));
  }, [exercises]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [draggingExercise, setDraggingExercise] = useState<
    (typeof exercises)[0] | null
  >(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    setDraggingExercise(
      exercises.find((exercise) => exercise.id === active.id) || null
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setExercises((exercises) => {
        const oldIndex = exercises.findIndex(
          (exercise) => exercise.id === active.id
        );
        const newIndex = exercises.findIndex(
          (exercise) => exercise.id === over.id
        );

        return arrayMove(exercises, oldIndex, newIndex);
      });

      setShouldSaveReorder(generateId());
    }

    setDraggingExercise(null);
  };

  const [shouldSaveReorder, setShouldSaveReorder] = useState<string>("");
  const debouncedShouldSaveReorder = useDebounce(shouldSaveReorder, 1500);

  const lastSubmission = useActionData<typeof action>();
  const [
    reorderExercisesForm,
    { orderedExercisesIds, actionIntent: reorderExercisesFormActionIntent },
  ] = useForm<ReorderExercisesSchema>({
    id: `reorder-exercises`,
    lastSubmission,
    defaultValue: {
      actionIntent: ActionIntents.ReorderExercises,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: reorderExercisesSchema });
    },
  });

  const submit = useSubmit();
  useEffect(() => {
    if (debouncedShouldSaveReorder) {
      submit(reorderExercisesForm.ref.current, {
        preventScrollReset: true,
        replace: true,
      });
    }
  }, [debouncedShouldSaveReorder, reorderExercisesForm.ref, submit]);

  return (
    <>
      <div className="px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Heading className="hidden text-gray-900 dark:text-gray-50 lg:block">
            {trainingDay.mesocycle!.name}
          </Heading>

          {muscleGroups.length > 0 ? (
            <ul className="mb-4 flex flex-wrap gap-2 lg:mt-4">
              {muscleGroups.map((muscleGroup, index) => (
                <li key={muscleGroup}>
                  <MuscleGroupBadge index={index}>
                    {muscleGroup}
                  </MuscleGroupBadge>
                </li>
              ))}
            </ul>
          ) : null}

          <TrainingDayLabelForm />
        </div>
      </div>

      <div className="pb-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={exercises}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-6">
              {exercises.map((exercise) => (
                <SortableExercise key={exercise.id} exercise={exercise} />
              ))}
            </ol>
          </SortableContext>
          <DragOverlay>
            {draggingExercise ? (
              <Exercise asDiv exercise={draggingExercise} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <div ref={exercisesListEndRef} />

        <div
          className={clsx(
            "px-4 sm:px-6 lg:px-8",
            exercises.length > 0 && "mt-8"
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

      <Form className="hidden" method="post" {...reorderExercisesForm.props}>
        <input
          {...conform.input(reorderExercisesFormActionIntent, { hidden: true })}
        />

        {exercises.map((exercise, index) => (
          <Fragment key={exercise.id}>
            <input
              type="hidden"
              id={`${reorderExercisesForm.id}-${orderedExercisesIds.name}[${index}]`}
              name={`${orderedExercisesIds.name}[${index}]`}
              value={exercise.id}
            />
          </Fragment>
        ))}
      </Form>
    </>
  );
}
