import { Link, useLoaderData } from "@remix-run/react";
import type { CurrentMesocycleStartedData } from "./route";
import { addDays } from "date-fns";
import clsx from "clsx";
import { Popover, Transition } from "@headlessui/react";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";

type CalendarProps = {
  darkButton?: boolean;
};

export function Calendar({ darkButton }: CalendarProps) {
  const { calendarDays, microcycleLength } =
    useLoaderData<CurrentMesocycleStartedData>();

  const lastMicrocycleStartDay = calendarDays
    .filter((_, index) => index % microcycleLength === 0)
    .at(-1);

  let lastMicrocycleEndDate: string | null = null;
  if (lastMicrocycleStartDay) {
    lastMicrocycleEndDate = addDays(
      new Date(lastMicrocycleStartDay.date),
      microcycleLength - 1
    ).toISOString();
  }

  const microcycleDays = Array(microcycleLength).fill(0);

  return (
    <Popover className="relative flex items-center">
      <Popover.Button
        type="button"
        className={clsx(
          "rounded  focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75",
          darkButton
            ? "text-zinc-800 hover:text-zinc-950 focus-visible:ring-zinc-950"
            : "text-zinc-200 hover:text-white focus-visible:ring-white"
        )}
      >
        <span className="sr-only">Calendar</span>
        <CalendarDaysIcon className="h-7 w-7" />
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute right-0 top-0 z-10 -mx-4 mt-10 flex w-screen sm:-mx-6 lg:-mx-8">
          <div className="mx-auto w-full max-w-sm rounded-lg bg-white pb-2 shadow-lg ring-2 ring-zinc-400 sm:ml-auto sm:mr-0">
            <div className="flex flex-col gap-1 border-b border-b-zinc-200 px-4 py-3 text-zinc-900">
              <p className="text-base font-semibold">Mesocycle calendar</p>
              <p className="text-sm text-zinc-600">
                Greyed out days are rest days or days of a future microcycle the
                app will plan for you.
              </p>
            </div>

            <div
              style={{
                gridTemplateColumns: `repeat(${microcycleLength}, minmax(0, 1fr))`,
              }}
              className="grid pt-3 text-center text-xs font-bold leading-6 text-zinc-500"
            >
              {microcycleDays.map((_, index) => (
                <span key={index}>D{index + 1}</span>
              ))}
            </div>

            <div
              style={{
                gridTemplateColumns: `repeat(${microcycleLength}, minmax(0, 1fr))`,
              }}
              className="isolate m-2 grid gap-px rounded-lg bg-zinc-200 text-sm shadow ring-1 ring-zinc-200"
            >
              {calendarDays.map((day, dayIdx) =>
                day.isPlannedTrainingDay ? (
                  <Link
                    to={`.?date=${encodeURIComponent(day.date)}`}
                    key={day.date}
                    className={clsx(
                      "bg-white text-zinc-900",
                      dayIdx === 0 && "rounded-tl-lg",
                      dayIdx === microcycleLength - 1 && "rounded-tr-lg",
                      lastMicrocycleStartDay &&
                        day.date === lastMicrocycleStartDay.date &&
                        "rounded-bl-lg",
                      lastMicrocycleEndDate &&
                        day.date === lastMicrocycleEndDate &&
                        "rounded-br-lg",
                      "py-1.5 hover:bg-zinc-100 focus:z-10"
                    )}
                  >
                    <time
                      dateTime={day.date}
                      className={clsx(
                        day.isCurrent &&
                          "bg-orange-600 font-semibold text-white",
                        "mx-auto flex h-7 w-7 items-center justify-center rounded-full"
                      )}
                    >
                      {new Date(day.date).getDate()}
                    </time>
                  </Link>
                ) : (
                  <span
                    key={day.date}
                    className={clsx(
                      "bg-zinc-50 text-zinc-400",
                      dayIdx === 0 && "rounded-tl-lg",
                      dayIdx === microcycleLength - 1 && "rounded-tr-lg",
                      lastMicrocycleStartDay &&
                        day.date === lastMicrocycleStartDay.date &&
                        "rounded-bl-lg",
                      lastMicrocycleEndDate &&
                        day.date === lastMicrocycleEndDate &&
                        "rounded-br-lg",
                      "py-1.5 hover:bg-zinc-100 focus:z-10"
                    )}
                  >
                    <time
                      dateTime={day.date}
                      className={clsx(
                        day.isCurrent &&
                          "bg-orange-600 font-semibold text-white",
                        "mx-auto flex h-7 w-7 items-center justify-center rounded-full"
                      )}
                    >
                      {new Date(day.date).getDate()}
                    </time>
                  </span>
                )
              )}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
