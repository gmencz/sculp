import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { Fragment } from "react";
import type { RequestAccessSchema, action } from "~/routes/request-access";
import { requestAccessSchema } from "~/routes/request-access";
import { useModal } from "~/utils";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { Input } from "./input";
import { SubmitButton } from "./submit-button";

export function RequestAccessModal() {
  const { show, closeModal } = useModal("request_access");
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-zinc-50 p-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-md">
                {isSuccess ? (
                  <div className="relative flex flex-col items-center justify-center text-center">
                    <button
                      type="button"
                      className="absolute right-0 top-0 rounded-md bg-zinc-200 p-1 text-zinc-950 hover:bg-zinc-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <img
                      className="h-24 w-24 rounded-full"
                      src="/logo.png"
                      alt="Logo"
                    />

                    <Dialog.Title
                      as="h3"
                      className="mt-6 flex text-xl font-semibold text-zinc-950"
                    >
                      You are on the waitlist
                    </Dialog.Title>

                    <p className="my-4 text-sm text-zinc-700">
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
                        className="flex items-center gap-4 text-xl font-semibold text-zinc-950"
                      >
                        <img
                          className="h-11 w-11 rounded-full"
                          src="/logo.png"
                          alt="Logo"
                        />
                        <span>Request Access</span>
                      </Dialog.Title>

                      <button
                        type="button"
                        className="ml-auto rounded-md bg-zinc-200 p-1 text-zinc-950 hover:bg-zinc-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                        onClick={closeModal}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="mt-4 text-sm text-zinc-700">
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
      className="mt-6 text-zinc-950"
      {...form.props}
    >
      <div className="flex flex-col gap-4">
        <Input label="Email" config={email} type="email" />
        <Input
          label="Current logbook (optional)"
          config={currentLogbook}
          type="text"
          helperText="Are you currently using a logbook? E.g. Strong app, Notes on your phone, Excel sheets."
        />
      </div>

      <div className="mt-6">
        <SubmitButton
          isSubmitting={isSubmitting}
          text={isSubmitting ? "Requesting Access..." : "Request Access"}
        />
      </div>
    </fetcher.Form>
  );
}
