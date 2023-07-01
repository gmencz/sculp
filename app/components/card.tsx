import clsx from "clsx";
import type { PropsWithChildren } from "react";

type CardProps = {
  className?: string;
};

export function Card({ children, className }: PropsWithChildren<CardProps>) {
  return (
    <div
      className={clsx(
        "mx-auto mb-4 w-full max-w-2xl bg-white px-4 py-6 dark:bg-zinc-950 sm:rounded-md",
        className
      )}
    >
      {children}
    </div>
  );
}
