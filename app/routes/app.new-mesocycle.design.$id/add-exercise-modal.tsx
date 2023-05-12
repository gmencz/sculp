import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useSearchParams } from "@remix-run/react";
import { Fragment } from "react";
import { useModal } from "~/utils";
import { AddExerciseForm } from "./add-exercise-form";

export const MODAL_NAME = "add_exercise";

export function AddExerciseModal() {
  const { show, closeModal } = useModal(MODAL_NAME, ["day_number"]);
  const [searchParams] = useSearchParams();
  const dayNumber = searchParams.get("day_number");

  return (
    <Transition.Root show={show} as={Fragment} appear>
      <Dialog
        as="div"
        className="fixed bottom-0 left-0 z-50 w-full"
        onClose={closeModal}
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
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-10 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-lg">
                <div className="flex items-center gap-4">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-zinc-950"
                  >
                    <span>Add an exercise to day {dayNumber}</span>
                  </Dialog.Title>

                  <button
                    type="button"
                    className="ml-auto rounded-md bg-zinc-100 p-1 hover:bg-zinc-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                    onClick={closeModal}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4">
                  <AddExerciseForm />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
