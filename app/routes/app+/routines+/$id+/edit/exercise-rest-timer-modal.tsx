import { Dialog, Transition } from "@headlessui/react";
import type { SelectedExercise, action } from "./route";
import { Fragment } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { classes } from "~/utils/classes";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { UpdateExerciseRestTimersSchema } from "./schema";
import { Intent, updateExerciseRestTimersSchema } from "./schema";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Select } from "~/components/select";
import { secondsToTime } from "~/utils/strings";

type ExerciseRestTimerModalProps = {
  selectedExercise: SelectedExercise | null;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function ExerciseRestTimerModal({
  selectedExercise,
  show,
  setShow,
}: ExerciseRestTimerModalProps) {
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
              <Dialog.Panel className="relative flex w-full transform flex-col rounded-lg bg-white text-left text-zinc-950 shadow-xl transition-all dark:bg-zinc-950 dark:text-white sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {selectedExercise ? (
                  <ExerciseRestTimerForm
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

const restTimersOptions = [
  "off",
  "0:15",
  "0:30",
  "0:45",
  "1:00",
  "1:15",
  "1:30",
  "1:45",
  "2:00",
  "2:15",
  "2:30",
  "2:45",
  "3:00",
  "3:15",
  "3:30",
  "3:45",
  "4:00",
  "4:15",
  "4:30",
  "4:45",
  "5:00",
  "5:15",
  "5:30",
  "5:45",
  "6:00",
  "6:15",
  "6:30",
  "6:45",
  "7:00",
  "7:15",
  "7:30",
  "7:45",
  "8:00",
  "8:15",
  "8:30",
  "8:45",
  "9:00",
  "9:15",
  "9:30",
  "9:45",
  "10:00",
];

type ExerciseRestTimerFormProps = {
  selectedExercise: SelectedExercise;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

function ExerciseRestTimerForm({
  selectedExercise,
  setShow,
}: ExerciseRestTimerFormProps) {
  const navigation = useNavigation();
  const lastSubmission = useActionData<typeof action>();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === Intent.UPDATE_EXERCISE_REST_TIMER;

  const [form, { intent, id, normalRestTimer, warmUpRestTimer }] =
    useForm<UpdateExerciseRestTimersSchema>({
      id: "update-exercise-rest-timers-modal",
      lastSubmission,
      defaultValue: {
        intent: Intent.UPDATE_EXERCISE_REST_TIMER,
        id: selectedExercise.id,
        normalRestTimer: selectedExercise.normalSetsRestTimerInSeconds
          ? secondsToTime(selectedExercise.normalSetsRestTimerInSeconds)
          : "off",
        warmUpRestTimer: selectedExercise.warmUpSetsRestTimerInSeconds
          ? secondsToTime(selectedExercise.warmUpSetsRestTimerInSeconds)
          : "off",
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateExerciseRestTimersSchema });
      },
    });

  return (
    <Form method="post" preventScrollReset replace {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />

      <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-medium">
          Rest Timers - {selectedExercise.name}
        </span>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Select
          config={normalRestTimer}
          label="Normal Set"
          options={restTimersOptions}
          above
        />
      </div>

      <div className="px-6 py-4 dark:border-zinc-800">
        <Select
          config={warmUpRestTimer}
          label="Warm Up"
          options={restTimersOptions}
          above
        />
      </div>

      <div className="flex gap-4 px-6 py-4">
        <button
          disabled={isSubmitting}
          type="submit"
          className={clsx(classes.buttonOrLink.primary, "flex-1")}
        >
          Save
        </button>
        <button
          disabled={isSubmitting}
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
