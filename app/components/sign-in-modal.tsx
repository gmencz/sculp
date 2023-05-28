import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { Fragment } from "react";
import type { SignInSchema, action } from "~/routes/sign-in";
import { signInSchema } from "~/routes/sign-in";
import { useModal } from "~/utils";
import { Input } from "./input";
import { SubmitButton } from "./submit-button";
import { configRoutes } from "~/config-routes";

export function SignInModal() {
  const { show, closeModal } = useModal("sign_in");
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
                    <span>Sign in</span>
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
                  Use your credentials to sign in to your account and access the
                  app.
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
      className="mt-6 text-zinc-950"
      {...form.props}
    >
      <div className="flex flex-col gap-6">
        <Input label="Email" config={email} type="email" />
        <Input
          label="Password"
          config={password}
          type="password"
          linkAbove={{
            text: "Forgot password?",
            to: configRoutes.auth.forgotPassword,
          }}
        />
      </div>

      <div className="mt-6">
        <SubmitButton
          isSubmitting={isSubmitting}
          text={isSubmitting ? "Checking credentials..." : "Sign in"}
        />
      </div>

      {lastSubmission?.error.form ? (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {lastSubmission?.error.form}
        </p>
      ) : null}
    </fetcher.Form>
  );
}
