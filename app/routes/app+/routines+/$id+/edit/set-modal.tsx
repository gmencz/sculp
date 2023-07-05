import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { SelectedSet, action } from "./route";
import { TrashIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Form, useActionData } from "@remix-run/react";
import { conform, useForm } from "@conform-to/react";
import type { RemoveSetSchema, UpdateSetSchema } from "./schema";
import { Intent, removeSetSchema, updateSetSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { SetType } from "@prisma/client";

type SetModalProps = {
  selectedSet: SelectedSet | null;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function SetModal({ selectedSet, show, setShow }: SetModalProps) {
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
                {selectedSet ? (
                  <>
                    <SetTypeForm selectedSet={selectedSet} setShow={setShow} />
                    <RemoveSetForm selectedSet={selectedSet} />
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

type SetTypeFormProps = {
  setShow: (value: React.SetStateAction<boolean>) => void;
  selectedSet: SelectedSet;
};

function SetTypeForm({ setShow, selectedSet }: SetTypeFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const lastSubmissionSetId = lastSubmission?.payload.id as unknown as string;
  const [form, { id, intent, type }] = useForm<UpdateSetSchema>({
    id: "update-set-modal",
    lastSubmission:
      lastSubmissionSetId === selectedSet.id ? lastSubmission : undefined,
    defaultValue: {
      intent: Intent.UPDATE_SET,
      id: selectedSet.id,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateSetSchema });
    },
  });

  return (
    <Form method="post" preventScrollReset replace {...form.props}>
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />

      <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-medium">Select Set Type</span>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-col items-start gap-2 px-3 py-4">
        <button
          className="flex w-full items-center gap-4 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          type="submit"
          name={type.name}
          value={SetType.WARM_UP}
        >
          <span className="w-8 text-xl font-bold text-blue-400">W</span>
          <span>Warm Up Set</span>
        </button>
        <button
          className="flex w-full items-center gap-4 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          type="submit"
          name={type.name}
          value={SetType.NORMAL}
        >
          <span className="w-8 text-xl font-bold text-orange-500">1</span>
          <span>Normal Set</span>
        </button>
        <button
          className="flex w-full items-center gap-4 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          type="submit"
          name={type.name}
          value={SetType.DROP}
        >
          <span className="w-8 text-xl font-bold text-lime-500">D</span>
          <span>Drop Set</span>
        </button>
        <button
          className="flex w-full items-center gap-4 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          type="submit"
          name={type.name}
          value={SetType.CLUSTER}
        >
          <span className="w-8 text-xl font-bold text-purple-600">C</span>
          <span>Cluster Set</span>
        </button>
      </div>
    </Form>
  );
}

type RemoveSetFormProps = {
  selectedSet: SelectedSet;
};

function RemoveSetForm({ selectedSet }: RemoveSetFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const lastSubmissionSetId = lastSubmission?.payload.id as unknown as string;
  const [form, { id, intent }] = useForm<RemoveSetSchema>({
    id: "remove-set-modal",
    lastSubmission:
      lastSubmissionSetId === selectedSet.id ? lastSubmission : undefined,
    defaultValue: {
      intent: Intent.REMOVE_SET,
      id: selectedSet.id,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: removeSetSchema });
    },
  });

  return (
    <Form
      className="px-5 pb-8"
      method="post"
      preventScrollReset
      replace
      {...form.props}
    >
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />

      <button
        type="submit"
        className="-m-2 flex w-full items-center justify-start gap-4 rounded-md p-2 px-2 text-red-500 hover:bg-zinc-50 disabled:text-zinc-100 dark:hover:bg-zinc-900 dark:disabled:text-zinc-800"
      >
        <TrashIcon className="h-6 w-8" />
        <span>Remove Set</span>
      </button>
    </Form>
  );
}
