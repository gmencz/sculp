import { Dialog, Transition } from "@headlessui/react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import { Fragment, useState } from "react";
import { AppPageLayout } from "~/components/app-page-layout";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { env } from "~/utils/env.server";
import { signOut } from "~/services/auth/api/sign-out";
import { requireUserId } from "~/services/auth/api/require-user-id";
import { stripe } from "~/services/stripe/config.server";
import { useDebouncedSubmit } from "~/utils/hooks";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { useForm } from "@conform-to/react";
import type { PreferencesSchema } from "./schema";
import { TrackRir, preferencesSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { Theme, WeightUnit } from "@prisma/client";
import { redirectBack } from "~/utils/responses.server";
import {
  AdjustmentsHorizontalIcon,
  ArrowUpTrayIcon,
  LockClosedIcon,
} from "@heroicons/react/20/solid";
import { AppPageHeader } from "~/components/app-page-header";

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
      trackRir: true,
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

  const { name, themePreference, weightUnitPreference, trackRir } =
    submission.value;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      themePreference,
      weightUnitPreference,
      trackRir: trackRir === TrackRir.YES,
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
  const lastSubmission = useActionData<typeof action>();
  const [
    preferencesForm,
    { name: namePreference, themePreference, weightUnitPreference, trackRir },
  ] = useForm<PreferencesSchema>({
    id: "preferences",
    lastSubmission,
    shouldValidate: "onInput",
    defaultValue: {
      name: user.name,
      trackRir: user.trackRir ? TrackRir.YES : TrackRir.NO,
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
      <AppPageHeader pageTitle="Profile" />

      <AppPageLayout>
        <div className="mx-auto mb-4 w-full max-w-2xl bg-white dark:bg-zinc-950 sm:rounded-md">
          <div className="flex items-center gap-4 px-4 py-6">
            <AdjustmentsHorizontalIcon className="h-6 w-6" />
            <h3 className="text-lg font-semibold leading-7">Preferences</h3>
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
                <dt className="text-base font-medium leading-6">Name</dt>
                <dd className="mt-3 sm:mt-0">
                  <Input
                    config={namePreference}
                    label="Name"
                    hideLabel
                    hideErrorMessage
                    placeholder="Your Name Here"
                  />
                </dd>
              </div>
              <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-base font-medium leading-6">Theme</dt>
                <dd className="mt-3 sm:mt-0">
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
                <dt className="text-base font-medium leading-6">Weight Unit</dt>
                <dd className="mt-3 sm:mt-0">
                  <Select
                    config={weightUnitPreference}
                    label="Weight Unit"
                    options={weightUnitPreferenceOptions}
                    hideLabel
                    hideErrorMessage
                  />
                </dd>
              </div>
              <div className="items-center gap-4 px-4 py-6 sm:grid sm:grid-cols-3">
                <dt className="text-base font-medium leading-6">
                  Track RIR (Reps In Reserve)
                </dt>
                <dd className="mt-3 sm:mt-0">
                  <Select
                    config={trackRir}
                    label="Track RIR"
                    options={[TrackRir.YES, TrackRir.NO]}
                    hideLabel
                    hideErrorMessage
                    capitalizeOptions
                  />
                </dd>
              </div>
            </dl>
          </Form>
        </div>

        <div className="mx-auto mb-4 w-full max-w-2xl bg-white dark:bg-zinc-950 sm:rounded-md">
          <div className="flex items-center gap-4 px-4 py-6">
            <ArrowUpTrayIcon className="h-6 w-6" />
            <h3 className="text-lg font-semibold leading-7">
              Import & Export Data
            </h3>
          </div>

          <dl className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-base font-medium leading-6">Import Data</dt>
              <dd className="mt-1 flex items-center text-base leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                <p>We currently support importing data from Hevy and Strong.</p>

                <span className="ml-10 flex-shrink-0">
                  <button className={classes.buttonOrLink.secondary}>
                    Upload CSV
                  </button>
                </span>
              </dd>
            </div>
            <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-base font-medium leading-6">Export Data</dt>
              <dd className="mt-1 flex items-center text-base leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                <p>
                  Export all your training history, routines and exercises to a
                  CSV file. This can not be imported back into Sculped.
                </p>

                <span className="ml-10 flex-shrink-0">
                  <button className={classes.buttonOrLink.secondary}>
                    Export CSV
                  </button>
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mx-auto w-full max-w-2xl bg-white dark:bg-zinc-950 sm:rounded-md">
          <div className="flex items-center gap-4 px-4 py-6">
            <LockClosedIcon className="h-6 w-6" />
            <h3 className="mt-1 text-lg font-semibold leading-7">
              Account & Subscription
            </h3>
          </div>

          <dl className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-base font-medium leading-6">Email</dt>
              <dd className="mt-1 text-base leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                {user?.email}
              </dd>
            </div>
            <div className="items-center px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-base font-medium leading-6">Subscription</dt>
              <dd className="mt-1 flex items-center text-base leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                <div className="flex-grow capitalize">
                  {user.subscription?.status}
                </div>

                <span className="ml-10 flex-shrink-0">
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
              <dt className="text-base font-medium leading-6">Created</dt>
              <dd className="mt-1 text-base leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
                {format(new Date(user.createdAt), "MMMM' 'd' 'yyyy")}
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-4 border-t border-zinc-200 px-4 py-6 dark:border-zinc-800">
            <a
              href={configRoutes.auth.signOut}
              className={clsx(classes.buttonOrLink.secondary, "!flex-1")}
            >
              Sign Out
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={clsx(classes.buttonOrLink.dangerous, "!flex-1")}
            >
              Delete Account
            </button>
          </div>
        </div>
      </AppPageLayout>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={setOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left text-zinc-950 shadow-xl transition-all dark:bg-zinc-950 dark:text-white sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <p>
                    Delete account? All of your data will be permanently deleted
                    from our servers and your subscription will be immediately
                    cancelled.
                  </p>

                  <div className="mt-4 flex gap-4">
                    <Form replace className="flex-1" method="delete">
                      <button
                        type="submit"
                        className={clsx(
                          classes.buttonOrLink.dangerous,
                          "w-full"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        Confirm
                      </button>
                    </Form>
                    <button
                      type="button"
                      className={clsx(
                        classes.buttonOrLink.secondary,
                        "!flex-1"
                      )}
                      onClick={() => setOpen(false)}
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
