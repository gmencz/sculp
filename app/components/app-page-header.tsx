import { ArrowSmallLeftIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";
import type { ReactElement } from "react";
import { configRoutes } from "~/utils/routes";

type AppPageHeaderProps = {
  pageTitle: string;
  goBackTo?: string;
  navigationItems?: { name: string; element: ReactElement }[];
};

export function AppPageHeader({
  pageTitle,
  goBackTo,
  navigationItems,
}: AppPageHeaderProps) {
  return (
    <div className="sticky top-0 z-50 mx-auto w-full max-w-2xl border-b border-zinc-900/10 bg-white px-4 py-3 dark:border-zinc-50/10 dark:bg-zinc-950 sm:mt-6 sm:rounded-tl-md sm:rounded-tr-md">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-8">
        <div className="flex items-center gap-4 truncate">
          {goBackTo ? (
            <Link to={goBackTo}>
              <ArrowSmallLeftIcon className="h-9 w-9" />
              <span className="sr-only">Go back</span>
            </Link>
          ) : (
            <Link to={configRoutes.app.home}>
              <img
                className="h-9 w-auto rounded-md dark:border dark:border-zinc-700"
                src="/logo.png"
                alt="Sculped"
              />
            </Link>
          )}

          <span className="max-w-xl text-lg font-semibold text-zinc-950 dark:text-white">
            {pageTitle}
          </span>
        </div>

        {navigationItems?.length ? (
          <nav className="shrink-0">
            <ul className="flex items-center gap-4">
              {navigationItems.map((item) => (
                <li className="flex items-center" key={item.name}>
                  {item.element}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
