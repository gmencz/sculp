import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { Form, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import { Fragment, useRef, useState } from "react";
import { deleteUser, getUserDetails } from "~/models/user.server";
import { logout, requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await getUserDetails(userId);

  if (!user) {
    throw await logout(request);
  }

  return json({ user });
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
  if (request.method === "DELETE") {
    await deleteUser(userId);
    return logout(request);
  }

  throw new Response("Method Not Allowed", { status: 405 });
};

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  const [open, setOpen] = useState(false);
  const cancelButtonRef = useRef(null);

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div>
          <h3 className="text-base font-semibold leading-7 text-zinc-900">
            Profile
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
            Your profile's details and account.
          </p>
        </div>
        <div className="mt-6 border-t border-zinc-200">
          <dl className="divide-y divide-zinc-200">
            <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6 text-zinc-900">
                Email
              </dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {user?.email}
              </dd>
            </div>
            <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6 text-zinc-900">
                Joined
              </dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-700 sm:col-span-2 sm:mt-0">
                {format(new Date(user.createdAt), "EEEE', 'MMMM' 'd' 'yyyy")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-4 border-t border-zinc-200 pt-6">
          <a
            href="/sign-out"
            className="inline-flex gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ArrowLeftOnRectangleIcon
              className="-ml-0.5 h-5 w-5"
              aria-hidden="true"
            />
            Sign out
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Delete account
          </button>
        </div>
      </div>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpen}
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
                        Delete account
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete your account? All of
                          your data will be permanently removed from our servers
                          forever. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Form method="delete">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={() => setOpen(false)}
                      >
                        Delete
                      </button>
                    </Form>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
