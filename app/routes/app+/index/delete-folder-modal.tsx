import { Dialog, Transition } from "@headlessui/react";
import type { SelectedFolder, action } from "./route";
import { Fragment } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import type { DeleteFolderSchema } from "./schema";
import { Intent, deleteFolderSchema } from "./schema";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import clsx from "clsx";
import { classes } from "~/utils/classes";

type DeleteFolderModalProps = {
  selectedFolder: SelectedFolder | null;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function DeleteFolderModal({
  selectedFolder,
  show,
  setShow,
}: DeleteFolderModalProps) {
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
                {selectedFolder ? (
                  <DeleteFolderForm
                    selectedFolder={selectedFolder}
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

type DeleteFolderFormProps = {
  selectedFolder: SelectedFolder;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

function DeleteFolderForm({ selectedFolder, setShow }: DeleteFolderFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [deleteFolderForm, { intent, id }] = useForm<DeleteFolderSchema>({
    id: "delete-folder",
    lastSubmission,
    defaultValue: {
      id: selectedFolder.id,
      intent: Intent.DELETE_FOLDER,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: deleteFolderSchema });
    },
  });

  const navigation = useNavigation();
  const isSubmitting =
    navigation.formData?.get("intent") === Intent.DELETE_FOLDER &&
    navigation.state === "submitting";

  return (
    <Form
      method="post"
      className="px-6 py-4"
      preventScrollReset
      replace
      {...deleteFolderForm.props}
    >
      <input {...conform.input(intent, { hidden: true })} />
      <input {...conform.input(id, { hidden: true })} />

      <p>
        Delete folder <span className="font-bold">{selectedFolder.name}</span>?
        All routines inside will be deleted as well.
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
