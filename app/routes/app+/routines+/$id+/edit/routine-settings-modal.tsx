import { Dialog, Transition } from "@headlessui/react";
import type { action, loader } from "./route";
import { Fragment } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Select } from "~/components/select";
import { conform, useForm } from "@conform-to/react";
import type { UpdateRoutineSettingsSchema } from "./schema";
import {
  Intent,
  PreviousValuesFrom,
  updateRoutineSettingsSchema,
} from "./schema";
import { parse } from "@conform-to/zod";
import { TrackRir } from "~/routes/app+/profile/schema";
import clsx from "clsx";
import { classes } from "~/utils/classes";

type RoutineSettingsModalProps = {
  routine: Pick<
    SerializeFrom<typeof loader>["routine"],
    "name" | "trackRir" | "previousValuesFrom"
  >;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function RoutineSettingsModal({
  routine,
  show,
  setShow,
}: RoutineSettingsModalProps) {
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
                <RoutineSettingsForm routine={routine} setShow={setShow} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type RoutineSettingsFormProps = {
  routine: Pick<
    SerializeFrom<typeof loader>["routine"],
    "name" | "trackRir" | "previousValuesFrom"
  >;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

function RoutineSettingsForm({ routine, setShow }: RoutineSettingsFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.get("intent") === Intent.UPDATE_ROUTINE_SETTINGS;
  const [form, { trackRir, intent, previousValuesFrom }] =
    useForm<UpdateRoutineSettingsSchema>({
      id: "update-routine-settings",
      lastSubmission,
      defaultValue: {
        intent: Intent.UPDATE_ROUTINE_SETTINGS,
        trackRir: routine.trackRir ? TrackRir.YES : TrackRir.NO,
        previousValuesFrom:
          routine.previousValuesFrom === "ANY"
            ? PreviousValuesFrom.ANY
            : PreviousValuesFrom.SAME_ROUTINE,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateRoutineSettingsSchema });
      },
    });

  return (
    <Form method="post" preventScrollReset replace {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />

      <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-medium">Routine Settings</span>
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
          config={previousValuesFrom}
          label="Exercises Previous Values"
          options={[PreviousValuesFrom.ANY, PreviousValuesFrom.SAME_ROUTINE]}
          capitalizeOptions
        />
      </div>

      <div className="px-6 pb-8 pt-4 dark:border-zinc-800">
        <Select
          config={trackRir}
          label="Track RIR"
          options={[TrackRir.YES, TrackRir.NO]}
          capitalizeOptions
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
