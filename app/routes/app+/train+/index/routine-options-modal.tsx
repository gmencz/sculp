import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { SelectedRoutine } from "./route";
import {
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";

type RoutineOptionsModalProps = {
  selectedRoutine: SelectedRoutine | null;
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
  setShowDeleteRoutineModal: (value: React.SetStateAction<boolean>) => void;
};

export function RoutineOptionsModal({
  selectedRoutine,
  show,
  setShow,
  setShowDeleteRoutineModal,
}: RoutineOptionsModalProps) {
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
                  <span>{selectedRoutine?.name}</span>
                  <button
                    onClick={() => setShow(false)}
                    className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <Link
                  to={`/routines/${selectedRoutine?.id}`}
                  className="flex w-full items-center justify-start gap-6 border-b border-zinc-200 px-6 py-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <PencilIcon className="h-6 w-6" />
                  <span>Edit Routine</span>
                </Link>

                <Link
                  to={`/routines/new?routineId=${selectedRoutine?.id}`}
                  className="flex w-full items-center justify-start gap-6 border-b border-zinc-200 px-6 py-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <DocumentDuplicateIcon className="-ml-1 h-6 w-6" />
                  <span>Duplicate Routine</span>
                </Link>

                <button
                  onClick={() => {
                    setShow(false);
                    setShowDeleteRoutineModal(true);
                  }}
                  className="flex w-full items-center justify-start gap-6 px-6 py-4 text-red-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <TrashIcon className="-ml-1 h-6 w-6" />
                  <span>Delete Routine</span>
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
