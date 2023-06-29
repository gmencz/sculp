import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import { Fragment, useRef, useState } from "react";
import { AppPageLayout } from "~/components/app-page-layout";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { env } from "~/utils/env.server";
import { signOut } from "~/services/auth/api/sign-out";
import { requireUserId } from "~/services/auth/api/require-user-id";
import { stripe } from "~/services/stripe/config.server";
import { type MatchWithHeader, useDebouncedSubmit } from "~/utils/hooks";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { useForm } from "@conform-to/react";
import type { PreferencesSchema } from "./schema";
import { preferencesSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { Theme, WeightUnit } from "@prisma/client";
import { redirectBack } from "~/utils/responses.server";

export const handle: MatchWithHeader = {
  header: () => "Profile",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      name: true,
      themePreference: true,
      weightUnitPreference: true,
      subscription: {
        select: { status: true },
      },
    },
  });

  if (!user || !user.subscription) {
    throw await signOut(request);
  }

  const customerPortalLink =
    env.STRIPE_CUSTOMER_PORTAL_LINK +
    `?prefilled_email=${encodeURIComponent(user.email)}`;

  return json({
    user,
    customerPortalLink,
    themePreferenceOptions: Object.values(Theme),
    weightUnitPreferenceOptions: Object.values(WeightUnit),
  });
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);

  if (request.method === "DELETE") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
      },
    });

    if (user) {
      if (user.stripeCustomerId) {
        await stripe.customers.del(user.stripeCustomerId);
      }

      await prisma.user.delete({ where: { id: userId }, select: { id: true } });
    }

    return signOut(request);
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema: preferencesSchema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  console.log("valid");

  const { name, themePreference, weightUnitPreference } = submission.value;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      themePreference,
      weightUnitPreference,
    },
  });

  return redirectBack(request, { fallback: configRoutes.app.profile });
};

export default function Profile() {
  const {
    user,
    customerPortalLink,
    themePreferenceOptions,
    weightUnitPreferenceOptions,
  } = useLoaderData<typeof loader>();
  const [open, setOpen] = useState(false);
  const cancelButtonRef = useRef(null);
  const lastSubmission = useActionData<typeof action>();
  const [
    preferencesForm,
    { name: namePreference, themePreference, weightUnitPreference },
  ] = useForm<PreferencesSchema>({
    id: "preferences",
    lastSubmission,
    shouldValidate: "onInput",
    defaultValue: {
      name: user.name,
      themePreference: user.themePreference,
      weightUnitPreference: user.weightUnitPreference,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: preferencesSchema });
    },
  });

  const submit = useDebouncedSubmit(preferencesForm.ref.current, {
    replace: true,
    preventScrollReset: true,
  });

  return (
    <>
      <AppPageLayout>
        <div className="mx-auto mb-4 w-full max-w-2xl bg-white dark:bg-zinc-950 sm:rounded-md">
          <div className="px-4 py-6">
            <h3 className="text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
              Preferences
            </h3>
          </div>

          <Form
            replace
            preventScrollReset
            method="post"
            onChange={submit}
            {...preferencesForm.props}
          >
            <dl className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                  Name
                </dt>
                <dd className="mt-2 sm:mt-0">
                  <Input
                    config={namePreference}
                    label="Name"
                    hideLabel
                    hideErrorMessage
                    placeholder="Your name here"
                  />
                </dd>
              </div>
              <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                  Theme
                </dt>
                <dd>
                  <Select
                    config={themePreference}
                    label="Theme"
                    options={themePreferenceOptions}
                    hideLabel
                    capitalizeOptions
                    hideErrorMessage
                  />
                </dd>
              </div>
              <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                  Weight unit
                </dt>
                <dd>
                  <Select
                    config={weightUnitPreference}
                    label="Weight unit"
                    options={weightUnitPreferenceOptions}
                    hideLabel
                    hideErrorMessage
                  />
                </dd>
              </div>
            </dl>
          </Form>
        </div>

        <div className="mx-auto w-full max-w-2xl bg-white dark:bg-zinc-950 sm:rounded-md">
          <div className="px-4 py-6">
            <h3 className="text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
              Account
            </h3>
          </div>

          <dl className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                Email
              </dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                {user?.email}
              </dd>
            </div>
            <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                Subscription
              </dt>
              <dd className="mt-1 flex items-center text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                <div className="flex-grow capitalize">
                  {user.subscription?.status}
                </div>

                <span className="ml-4 flex-shrink-0">
                  <a
                    href={customerPortalLink}
                    className={classes.buttonOrLink.secondary}
                  >
                    Manage
                  </a>
                </span>
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
                Created
              </dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                {format(new Date(user.createdAt), "MMMM' 'd' 'yyyy")}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-4 border-t border-zinc-200 px-4 py-6 dark:border-zinc-800">
            <a
              href={configRoutes.auth.signOut}
              className={clsx(classes.buttonOrLink.secondary, "!flex-1")}
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              <TrashIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Delete account
            </button>
          </div>
        </div>
      </AppPageLayout>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[60]"
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-zinc-950 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-zinc-900 dark:text-zinc-50"
                      >
                        Delete account
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-zinc-500 dark:text-zinc-300">
                          Are you sure you want to delete your account? All of
                          your data will be permanently removed from our servers
                          forever and your subscription will be immediately
                          canceled. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Form replace method="delete">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={() => setOpen(false)}
                      >
                        Delete
                      </button>
                    </Form>
                    <button
                      type="button"
                      className={clsx(
                        classes.buttonOrLink.secondary,
                        "mt-3 w-full sm:mt-0 sm:w-auto"
                      )}
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
