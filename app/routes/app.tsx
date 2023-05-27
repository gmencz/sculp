import {
  CalendarDaysIcon,
  FolderIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import clsx from "clsx";
import type { PropsWithChildren, SVGAttributes } from "react";
import { Fragment } from "react";
import { requireUser } from "~/session.server";

const navigation = [
  {
    name: "Current",
    href: "/app",
    icon: CalendarDaysIcon,
    end: true,
  },
  {
    name: "Exercises",
    href: "/app/exercises",
    icon: (props: SVGAttributes<SVGElement>) => (
      <svg
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 485.535 485.535"
        {...props}
      >
        <g>
          <g id="_x35__13_">
            <g>
              <path
                d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
              />
              <path
                d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
              />
              <path
                d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
              />
            </g>
          </g>
        </g>
      </svg>
    ),
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

const mobileNavigation = [
  {
    name: "Current",
    href: "/app",
    icon: CalendarDaysIcon,
    end: true,
  },
  {
    name: "Exercises",
    href: "/app/exercises",
    icon: (props: SVGAttributes<SVGElement>) => (
      <svg
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 485.535 485.535"
        {...props}
      >
        <g>
          <g id="_x35__13_">
            <g>
              <path
                d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
              />
              <path
                d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
              />
              <path
                d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
              />
            </g>
          </g>
        </g>
      </svg>
    ),
  },
  {
    name: "Mesocycles",
    href: "/app/mesocycles",
    icon: FolderIcon,
  },
];

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

function Layout({ children }: PropsWithChildren) {
  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-950 px-6">
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

      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-900/10 bg-white px-6 pb-1 pt-3 shadow-lg lg:hidden">
        <nav className="mx-auto flex w-full max-w-sm flex-1 flex-col">
          <ul className="flex flex-1 items-center justify-between">
            {mobileNavigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  end={item.end}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      isActive ? "text-zinc-900" : "text-zinc-400",
                      "group flex flex-col items-center justify-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                    )
                  }
                >
                  <item.icon
                    className="mb-1 h-6 w-6 shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex items-center justify-between border-b border-zinc-900/10 bg-white px-4 py-3 shadow-lg lg:hidden">
        <div className="flex items-center gap-4">
          <img
            className="h-8 w-auto"
            src="/logo.png"
            alt="The Hypertrophy Logbook"
          />

          <span className="text-base font-medium text-zinc-950">
            Hypertrophy app
          </span>
        </div>

        <a
          href="/app/profile"
          className="flex items-center text-sm font-semibold leading-6 text-zinc-900 hover:bg-zinc-800"
        >
          <UserCircleIcon className="h-8 w-8 rounded-full" />
          <span className="sr-only">Your Profile</span>
        </a>
      </div>

      <main className="min-h-full bg-zinc-50 pb-16 lg:pb-0 lg:pl-72">
        {children}
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
