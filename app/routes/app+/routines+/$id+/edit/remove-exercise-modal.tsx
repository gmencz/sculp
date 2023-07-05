import { Dialog, Transition } from "@headlessui/react";
import type { SelectedExercise, action } from "./route";
import { Fragment } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { classes } from "~/utils/classes";
import {
  Intent,
  removeExerciseSchema,
  type RemoveExerciseSchema,
} from "./schema";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";

type RemoveExerciseModalProps = {
  selectedExercise: SelectedExercise | null;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function RemoveExerciseModal({
  selectedExercise,
  show,
  setShow,
}: RemoveExerciseModalProps) {
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
                  <RemoveExerciseForm
                    selectedExercise={selectedExercise}
                    setShow={setShow}
                  />
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type RemoveExerciseFormProps = {
  selectedExercise: SelectedExercise;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

function RemoveExerciseForm({
  selectedExercise,
  setShow,
}: RemoveExerciseFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const lastSubmission = useActionData<typeof action>();
  const lastSubmissionExerciseId = lastSubmission?.payload
    .id as unknown as string;
  const [form, { intent, id }] = useForm<RemoveExerciseSchema>({
    id: `remove-exercise-modal`,
    lastSubmission:
      lastSubmissionExerciseId === selectedExercise.id
        ? lastSubmission
        : undefined,
    defaultValue: {
      intent: Intent.REMOVE_EXERCISE,
      id: selectedExercise.id,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: removeExerciseSchema });
    },
  });

  return (
    <Form
      method="delete"
      className="px-6 py-4"
      preventScrollReset
      replace
      {...form.props}
    >
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />

      <p>
        Remove exercise{" "}
        <span className="font-bold">{selectedExercise.name}</span>?
      </p>

      <div className="mt-4 flex gap-4">
        <button
          disabled={isSubmitting}
          type="submit"
          className={clsx(classes.buttonOrLink.dangerous, "flex-1")}
        >
          Confirm
        </button>
        <button
          onClick={() => setShow(false)}
          type="button"
          className={clsx(classes.buttonOrLink.secondary, "flex-1")}
        >
          Cancel
        </button>
      </div>
    </Form>
  );
}
