import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FolderIcon, XMarkIcon } from "@heroicons/react/20/solid";
import type { SerializeFrom } from "@remix-run/server-runtime";
import type { loader } from "./route";
import { Link } from "@remix-run/react";
import { configRoutes } from "~/utils/routes";
import clsx from "clsx";
import { classes } from "~/utils/classes";

type NewRoutineModalProps = {
  folders: SerializeFrom<typeof loader>["folders"];
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
  setShowNewFolderModal: (value: React.SetStateAction<boolean>) => void;
};

export function NewRoutineModal({
  show,
  setShow,
  folders,
  setShowNewFolderModal,
}: NewRoutineModalProps) {
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
                <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <span className="font-medium">New Routine Folder</span>
                  <button
                    onClick={() => setShow(false)}
                    className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <ul className="flex flex-col">
                  {folders.map((folder) => (
                    <li key={folder.id}>
                      <Link
                        to={configRoutes.app.newRoutine(folder.id)}
                        className="flex w-full items-center justify-start gap-6 border-b border-zinc-200 px-6 py-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                      >
                        <FolderIcon className="h-6 w-6" />
                        <span>{folder.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="px-6 py-4">
                  <button
                    onClick={() => {
                      setShow(false);
                      setShowNewFolderModal(true);
                    }}
                    className={clsx(classes.buttonOrLink.primary, "w-full")}
                  >
                    New Folder
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
