import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { Fragment } from "react";
import type { RequestAccessSchema, action } from "~/routes/request-access";
import { requestAccessSchema } from "~/routes/request-access";
import { useModal } from "~/utils";
import { Spinner } from "./spinner";
import type { SerializeFrom } from "@remix-run/server-runtime";

export const MODAL_NAME = "request-access";

export function RequestAccessModal() {
  const { show, closeModal } = useModal(MODAL_NAME);
  const fetcher = useFetcher<typeof action>();
  const isSuccess =
    fetcher.data?.intent === "submit" &&
    Object.keys(fetcher.data.error).length === 0;

  return (
    <Transition.Root show={show} as={Fragment} appear>
      <Dialog
        as="div"
        className="fixed bottom-0 left-0 z-20 w-full"
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
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-zinc-900 p-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-md">
                <div
                  className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
                  aria-hidden="true"
                >
                  <div
                    className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
                    style={{
                      clipPath:
                        "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
                    }}
                  />
                </div>

                {isSuccess ? (
                  <div className="relative flex flex-col items-center justify-center text-center">
                    <button
                      type="button"
                      className="absolute right-0 top-0 rounded-md bg-zinc-800 p-1 text-white hover:bg-zinc-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <img
                      className="h-24 w-24 rounded-full border-2 border-zinc-600"
                      src="/logo.png"
                      alt="Logo"
                    />

                    <Dialog.Title
                      as="h3"
                      className="mt-6 flex text-xl font-semibold text-white"
                    >
                      You are on the waitlist
                    </Dialog.Title>

                    <p className="my-4 text-sm text-zinc-300">
                      We are glad you want to take your hypertrophy training to
                      the next level. We will send you an email at{" "}
                      <span className="font-bold">
                        {fetcher.data?.payload.email}
                      </span>{" "}
                      as soon as we have a spot ready for you!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <Dialog.Title
                        as="h3"
                        className="flex items-center gap-4 text-xl font-semibold text-white"
                      >
                        <img
                          className="h-11 w-11 rounded-full border-2 border-zinc-600"
                          src="/logo.png"
                          alt="Logo"
                        />
                        <span>Request Access</span>
                      </Dialog.Title>

                      <button
                        type="button"
                        className="ml-auto rounded-md bg-zinc-800 p-1 text-white hover:bg-zinc-700 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
                        onClick={closeModal}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="mt-4 text-sm text-zinc-200">
                      Join our waitlist and we will reach out to you as soon as
                      possible. Don't miss out on this opportunity to take your
                      hypertrophy training to the next level.
                    </p>

                    <RequestAccessForm fetcher={fetcher} />
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

interface RequestAccessFormProps {
  fetcher: FetcherWithComponents<SerializeFrom<typeof action>>;
}

function RequestAccessForm({ fetcher }: RequestAccessFormProps) {
  const isSubmitting = fetcher.state === "submitting";
  const lastSubmission = fetcher.data;
  const [form, { email, currentLogbook }] = useForm<RequestAccessSchema>({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: requestAccessSchema });
    },
  });

  return (
    <fetcher.Form
      method="post"
      action="/request-access"
      className="mt-6 text-white"
      {...form.props}
    >
      <div className="mt-6">
        <label
          htmlFor={email.id}
          className="block text-sm font-medium text-white"
        >
          Email
        </label>
        <div className="mt-2">
          <input
            className={clsx(
              "block w-full rounded-md border-0 bg-zinc-700 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-zinc-500 focus:outline-none focus:ring-2 focus:ring-inset",
              email.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "focus:ring-orange-600"
            )}
            {...conform.input(email, { type: "email" })}
          />
        </div>
        {email.error ? (
          <p
            className="mt-2 text-xs text-red-500"
            id="email-error"
            role="alert"
          >
            {email.error}
          </p>
        ) : (
          <p className="mt-2 text-xs text-zinc-200" id="email-description">
            We'll send you an email once we grant you access.
          </p>
        )}
      </div>

      <div className="mt-6">
        <label
          htmlFor={currentLogbook.id}
          className="block text-sm font-medium text-white"
        >
          Current logbook (optional)
        </label>
        <div className="mt-2">
          <input
            className={clsx(
              "block w-full rounded-md border-0 bg-zinc-700 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-zinc-500 focus:outline-none focus:ring-2 focus:ring-inset",
              currentLogbook.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "focus:ring-orange-600"
            )}
            {...conform.input(currentLogbook, { type: "text" })}
          />
        </div>
        {currentLogbook.error ? (
          <p
            className="mt-2 text-xs text-red-500"
            id="current-logbook-error"
            role="alert"
          >
            {currentLogbook.error}
          </p>
        ) : (
          <p
            className="mt-2 text-xs text-zinc-200"
            id="current-logbook-description"
          >
            Are you currently using a logbook? E.g. Strong app, Notes on your
            phone, Excel sheets.
          </p>
        )}
      </div>

      <div className="mt-8">
        <button
          disabled={isSubmitting}
          type="submit"
          className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <Spinner /> : null}
          <span>
            {isSubmitting ? "Requesting Access..." : "Request Access"}
          </span>
        </button>
      </div>
    </fetcher.Form>
  );
}
