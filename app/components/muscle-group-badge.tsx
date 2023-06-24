import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function MuscleGroupBadge(
  props: PropsWithChildren<{ index: number; white?: boolean }>
) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-x-2 rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700",
        props.white ? "text-white" : "text-zinc-900 dark:text-zinc-50"
      )}
    >
      <svg
        className={clsx(
          "h-1.5 w-1.5",
          props.index === 1
            ? "fill-red-500"
            : props.index === 2
            ? "fill-yellow-500"
            : props.index === 3
            ? "fill-green-500"
            : props.index === 4
            ? "fill-blue-500"
            : props.index === 5
            ? "fill-indigo-500"
            : "fill-orange-500"
        )}
        viewBox="0 0 6 6"
        aria-hidden="true"
      >
        <circle cx={3} cy={3} r={3} />
      </svg>
      {props.children}
    </span>
  );
}
