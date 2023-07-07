import { Dialog, Transition } from "@headlessui/react";
import type { action } from "./route";
import { Fragment } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { NewFolderSchema } from "./schema";
import { Intent, newFolderSchema } from "./schema";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import clsx from "clsx";
import { classes } from "~/utils/classes";

type NewFolderModalProps = {
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function NewFolderModal({ show, setShow }: NewFolderModalProps) {
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
                <NewFolderForm setShow={setShow} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type NewFolderFormProps = {
  setShow: (value: React.SetStateAction<boolean>) => void;
};

function NewFolderForm({ setShow }: NewFolderFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [form, { intent, name }] = useForm<NewFolderSchema>({
    id: "rename-folder",
    lastSubmission,
    shouldValidate: "onInput",
    defaultValue: {
      intent: Intent.NEW_FOLDER,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: newFolderSchema });
    },
  });

  const navigation = useNavigation();
  const isSubmitting =
    navigation.formData?.get("intent") === Intent.NEW_FOLDER &&
    navigation.state === "submitting";

  return (
    <Form
      method="post"
      className="px-6 py-4"
      preventScrollReset
      replace
      {...form.props}
    >
      <input {...conform.input(intent, { hidden: true })} />

      <Input config={name} label="New Folder Name" />

      <div className="mt-4 flex gap-4">
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
