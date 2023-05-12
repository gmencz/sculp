import { Dialog, Transition } from "@headlessui/react";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { Fragment, useRef } from "react";
import { useModal } from "~/utils";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { z } from "zod";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";

export const MODAL_NAME = "delete_exercise";

export const schema = z.object({
  exerciseId: z
    .string({
      invalid_type_error: "The exercise id is not valid.",
      required_error: "The exercise id is required.",
    })
    .min(1, "The exercise id is required."),

  dayNumber: z.coerce
    .number({
      invalid_type_error: "The day number is not valid.",
      required_error: "The day number is required.",
    })
    .min(1, `The day number must be at least 1.`)
    .max(6, `The day number can't be greater than 6.`),

  index: z.coerce
    .number({
      invalid_type_error: "The index is not valid.",
      required_error: "The index is required.",
    })
    .min(0, `The index must be at least 0.`)
    .max(6, `The index can't be greater than 6.`),
});

export type Schema = z.infer<typeof schema>;

export function DeleteExerciseModal() {
  const { show, closeModal } = useModal(MODAL_NAME, [
    "day_number",
    "exercise_id",
    "exercise_name",
    "index",
  ]);

  const [searchParams] = useSearchParams();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dayNumberValue = useRef(searchParams.get("day_number") as string);
  const exerciseIdValue = useRef(searchParams.get("exercise_id") as string);
  const indexValue = useRef(searchParams.get("index") as string);
  const exerciseName = useRef(
    decodeURIComponent(searchParams.get("exercise_name") as string)
  );

  const lastSubmission = useActionData();
  const [form, { dayNumber, exerciseId, index }] = useForm<Schema>({
    id: "delete-exercise",
    lastSubmission,
    defaultValue: {
      dayNumber: dayNumberValue.current,
      exerciseId: exerciseIdValue.current,
      index: indexValue.current,
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Delete exercise {Number(indexValue.current) + 1} from day{" "}
                      {dayNumberValue.current}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the{" "}
                        <span className="font-medium text-zinc-900">
                          {exerciseName.current}
                        </span>{" "}
                        exercise?
                      </p>
                    </div>
                  </div>
                </div>

                <Form method="post" {...form.props}>
                  <input type="hidden" name="intent" value="delete-exercise" />
                  <input {...conform.input(exerciseId, { hidden: true })} />
                  <input {...conform.input(dayNumber, { hidden: true })} />
                  <input {...conform.input(index, { hidden: true })} />

                  <div className="mt-5 sm:ml-10 sm:mt-4 sm:flex sm:pl-4">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 sm:w-auto"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-gray-900 sm:ml-3 sm:mt-0 sm:w-auto"
                      onClick={closeModal}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
