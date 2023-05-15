import { Dialog, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BookOpenIcon,
  CalendarDaysIcon,
  FolderIcon,
  PlusCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import {
  Link,
  NavLink,
  Outlet,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { Fragment, useState } from "react";
import { BackLink } from "~/components/back-link";
import { ErrorPage } from "~/components/error-page";
import { requireUser } from "~/session.server";

const navigation = [
  { name: "Today", href: "/app", icon: CalendarDaysIcon, end: true },
  {
    name: "Exercises",
    href: "/app/exercises",
    icon: BookOpenIcon,
  },
  {
    name: "Mesocycles",
    href: "/app/mesocycles",
    icon: FolderIcon,
  },
  {
    name: "Plan a new mesocycle",
    href: "/app/new-mesocycle",
    icon: PlusCircleIcon,
  },
];

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

function Layout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-950 px-6 pb-2 ring-1 ring-white/10">
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      className="h-8 w-auto"
                      src="/logo.png"
                      alt="The Hypertrophy Logbook"
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <NavLink
                                end={item.end}
                                to={item.href}
                                className={({ isActive }) =>
                                  clsx(
                                    isActive
                                      ? "bg-zinc-800 text-white"
                                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                                    "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                                  )
                                }
                              >
                                <item.icon
                                  className="h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/logo.png"
              alt="The Hypertrophy Logbook"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        end={item.end}
                        to={item.href}
                        className={({ isActive }) =>
                          clsx(
                            isActive
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                            "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                          )
                        }
                      >
                        <item.icon
                          className="h-6 w-6 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="/app/profile"
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white hover:bg-zinc-800"
                >
                  <UserCircleIcon className="h-8 w-8 rounded-full" />
                  <span aria-hidden="true">Your Profile</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-zinc-400 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-white">
          App
        </div>
        <a href="/">
          <span className="sr-only">Your profile</span>
          <UserCircleIcon className="h-8 w-8 rounded-full text-white" />
        </a>
      </div>

      <main className="h-full bg-zinc-50 lg:pl-72">
        <div className="h-full px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();

  if (isRouteErrorResponse(error)) {
    console.error("Caught route error", error);

    if (error.status === 404) {
      return (
        <Layout>
          <ErrorPage
            statusCode={error.status}
            title="Page not found"
            subtitle={`"${location.pathname}" is not a page. So sorry.`}
            action={<BackLink to="/app">Back to app</BackLink>}
          />
        </Layout>
      );
    }

    if (error.status !== 500) {
      return (
        <Layout>
          <ErrorPage
            statusCode={error.status}
            title="Oh no, something did not go well."
            subtitle={`"${location.pathname}" is currently not working. So sorry.`}
            action={<BackLink to="/app">Back to app</BackLink>}
          />
        </Layout>
      );
    }

    throw new Error(`Unhandled error: ${error.status}`);
  }

  console.error(`Uncaught error`, error);

  return (
    <Layout>
      <ErrorPage
        statusCode={500}
        title="Oh no, something did not go well."
        subtitle={`"${location.pathname}" is currently not working. So sorry.`}
        action={<BackLink to="/app">Back to app</BackLink>}
      />
    </Layout>
  );
}
