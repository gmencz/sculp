import { Form, useActionData, useSubmit } from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { parse } from "@conform-to/zod";
import type { Dispatch, SetStateAction } from "react";
import { forwardRef, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import { TrashIcon } from "@heroicons/react/20/solid";
import type { SpringRef, SpringValue } from "@react-spring/web";
import { animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Textarea } from "~/components/textarea";
import { useDebounce } from "~/utils/hooks";
import type { action, loader } from "./route";
import type { UpdateExerciseNotesSchema } from "./schema";
import { ActionIntents, updateExerciseNotesSchema } from "./schema";
import { generateId } from "~/utils/ids";

type UpdateExerciseNotesFormProps = {
  exercise: SerializeFrom<typeof loader>["trainingDay"]["exercises"][number];
  isXs: boolean;
  showNotes: boolean;
  setShowNotes: Dispatch<SetStateAction<boolean>>;
  x: SpringValue<number>;
  springApi: SpringRef<{
    x: number;
  }>;
};

export const UpdateExerciseNotesForm = forwardRef<
  HTMLElement,
  UpdateExerciseNotesFormProps
>(({ exercise, isXs, setShowNotes, showNotes, springApi, x }, ref) => {
  const lastSubmission = useActionData<typeof action>();
  const [form, { id, notes, actionIntent }] =
    useForm<UpdateExerciseNotesSchema>({
      id: `update-exercise-notes-${exercise.id}`,
      lastSubmission,
      defaultValue: {
        id: exercise.id,
        notes: exercise.notes ?? "",
        actionIntent: ActionIntents.UpdateExerciseNotes,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateExerciseNotesSchema });
      },
    });

  const submit = useSubmit();
  const [notesValue, setNotesValue] = useState(notes.defaultValue ?? "");
  const bind = useDrag(({ down, movement: [mx], ...rest }) => {
    // Allow dragging to the left (to delete) and only on small screens.
    if (!isXs || mx > 0) return;

    springApi.start({ x: down ? mx : 0, immediate: down });

    // If user drags to the left (at least half screen) and releases the drag, remove the set.
    if (Math.abs(mx) >= innerWidth / 2 && !down) {
      springApi.start({
        x: -innerWidth,
        immediate: false,
        onResolve: () => {
          setShowNotes(false);

          if (notesValue) {
            const formData = new FormData();
            formData.set(id.name, id.defaultValue!);
            formData.set(actionIntent.name, actionIntent.defaultValue!);
            formData.set(notes.name, "");
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

  const [shouldUpdate, setShouldUpdate] = useState<string>("");
  const debouncedShouldUpdate = useDebounce(shouldUpdate, 1500);

  useEffect(() => {
    if (debouncedShouldUpdate) {
      submit(form.ref.current, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [submit, form.ref, debouncedShouldUpdate]);

  return (
    <Form
      preventScrollReset
      replace
      method="post"
      onChange={() => setShouldUpdate(generateId())}
      {...form.props}
    >
      <input {...conform.input(id, { hidden: true })} />
      <input {...conform.input(actionIntent, { hidden: true })} />

      <Transition
        show={showNotes}
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="relative mb-3"
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
            ref={ref}
            autoSize
            hideLabel
            hideErrorMessage
            config={notes}
            label="Notes"
            onChangeValue={setNotesValue}
            placeholder="Notes"
          />
        </animated.div>
      </Transition>
    </Form>
  );
});
