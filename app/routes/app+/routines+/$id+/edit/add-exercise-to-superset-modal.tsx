import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { SelectedExercise, action, loader } from "./route";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Form, useActionData } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { conform, useForm } from "@conform-to/react";
import type { AddExerciseToSupersetSchema } from "./schema";
import { Intent, addExerciseToSupersetSchema } from "./schema";
import { parse } from "@conform-to/zod";

type AddExerciseToSupersetModalProps = {
  exercises: SerializeFrom<typeof loader>["routine"]["exercises"];
  selectedExercise: SelectedExercise | null;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
  supersetsColors: {
    [x: string]: string;
  };
};

export function AddExerciseToSupersetModal({
  exercises,
  selectedExercise,
  show,
  setShow,
  supersetsColors,
}: AddExerciseToSupersetModalProps) {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog
        onClose={() => setShow(false)}
        as="div"
        className="relative z-[60]"
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity dark:bg-zinc-900 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex w-full transform flex-col overflow-hidden rounded-lg bg-white text-left text-zinc-950 shadow-xl transition-all dark:bg-zinc-950 dark:text-white sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {selectedExercise ? (
                  <>
                    <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                      <span className="font-medium">
                        Superset {selectedExercise.name} with...
                      </span>
                      <button
                        onClick={() => setShow(false)}
                        className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <ExerciseSupersetForm
                      selectedExercise={selectedExercise}
                      setShow={setShow}
                      exercises={exercises}
                      supersetsColors={supersetsColors}
                    />
                  </>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type ExerciseSupersetFormProps = {
  setShow: (value: React.SetStateAction<boolean>) => void;
  selectedExercise: SelectedExercise;
  exercises: SerializeFrom<typeof loader>["routine"]["exercises"];
  supersetsColors: {
    [x: string]: string;
  };
};

function ExerciseSupersetForm({
  setShow,
  selectedExercise,
  exercises,
  supersetsColors,
}: ExerciseSupersetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { intent, id, withId }] = useForm<AddExerciseToSupersetSchema>({
    id: "add-exercise-to-superset-modal",
    lastSubmission,
    defaultValue: {
      intent: Intent.ADD_EXERCISE_TO_SUPERSET,
      id: selectedExercise.id,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: addExerciseToSupersetSchema });
    },
  });

  return (
    <Form
      method="post"
      className="relative p-6"
      preventScrollReset
      replace
      {...form.props}
    >
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />

      <ol className="flex flex-col gap-6">
        {exercises.map((exercise) => (
          <li key={`superset-with-${exercise.id}`}>
            {exercise.id === selectedExercise.id ? (
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl font-medium uppercase dark:bg-zinc-800">
                  {exercise.exercise.name.charAt(0)}
                </span>

                <span>{exercise.exercise.name}</span>

                {exercise.id === selectedExercise.id ? (
                  <CheckIcon className="ml-auto h-6 w-6 text-green-500" />
                ) : null}
              </div>
            ) : (
              <button
                type="submit"
                name={withId.name}
                value={exercise.id}
                className="-m-2 flex w-full items-center p-2"
              >
                {exercise.superset?.id ? (
                  <div className="mr-4 flex items-center justify-center">
                    <div
                      className="h-10 w-2 rounded-md"
                      style={{
                        backgroundColor: supersetsColors[exercise.superset.id],
                      }}
                    />
                    <span className="sr-only">Supersetted</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-4 text-left">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-xl font-medium uppercase dark:bg-zinc-800">
                    {exercise.exercise.name.charAt(0)}
                  </span>

                  <span>{exercise.exercise.name}</span>
                </div>
              </button>
            )}
          </li>
        ))}
      </ol>
    </Form>
  );
}
