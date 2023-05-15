import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import clsx from "clsx";
import { Fragment } from "react";
import type { SignInSchema, action } from "~/routes/sign-in";
import { signInSchema } from "~/routes/sign-in";
import { useModal } from "~/utils";
import { Spinner } from "./spinner";

export const MODAL_NAME = "sign-in";

export function SignInModal() {
  const { show, closeModal } = useModal(MODAL_NAME);
  const fetcher = useFetcher<typeof action>();

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
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-lg bg-zinc-950 p-6 text-left shadow-xl transition-all sm:my-8 sm:max-w-md">
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
                    <span>Sign in</span>
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
                  Use your credentials to sign in to your account and access
                  your logbook.
                </p>

                <SignInForm fetcher={fetcher} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

interface SignInFormProps {
  fetcher: FetcherWithComponents<SerializeFrom<typeof action>>;
}

function SignInForm({ fetcher }: SignInFormProps) {
  const isSubmitting = fetcher.state === "submitting";
  const lastSubmission = fetcher.data;
  const [form, { email, password }] = useForm<SignInSchema>({
    id: "sign-in",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: signInSchema });
    },
  });

  return (
    <fetcher.Form
      method="post"
      action="/sign-in"
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
            id={email.id}
            name={email.name}
            defaultValue={email.defaultValue}
            type="email"
            aria-invalid={email.error ? true : undefined}
            aria-describedby={email.errorId}
            autoFocus={Boolean(email.initialError)}
            placeholder="you@example.com"
            className={clsx(
              "block w-full rounded-md border-0 bg-zinc-700 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-zinc-500 focus:outline-none focus:ring-2 focus:ring-inset",
              email.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "focus:ring-orange-600"
            )}
          />
        </div>
        {email.error ? (
          <p
            className="mt-2 text-sm text-red-500"
            id={email.errorId}
            role="alert"
          >
            {email.error}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <label
          htmlFor={password.id}
          className="block text-sm font-medium text-white"
        >
          Password
        </label>
        <div className="mt-2">
          <input
            id={password.id}
            name={password.name}
            defaultValue={password.defaultValue}
            type="password"
            aria-invalid={password.error ? true : undefined}
            aria-describedby={password.errorId}
            autoFocus={Boolean(password.initialError)}
            className={clsx(
              "block w-full rounded-md border-0 bg-zinc-700 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-zinc-500 focus:outline-none focus:ring-2 focus:ring-inset",
              password.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "focus:ring-orange-600"
            )}
          />
        </div>
        {password.error ? (
          <p
            className="mt-2 text-sm text-red-500"
            id={password.errorId}
            role="alert"
          >
            {password.error}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <button
          disabled={isSubmitting}
          type="submit"
          className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? <Spinner /> : null}
          <span>{isSubmitting ? "Checking credentials..." : "Sign in"}</span>
        </button>
      </div>

      {lastSubmission?.error.form ? (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {lastSubmission?.error.form}
        </p>
      ) : null}
    </fetcher.Form>
  );
}
