import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function Heading({
  children,
  className,
}: PropsWithChildren<{ white?: boolean; className?: string }>) {
  return (
    <h1
      className={clsx(
        "leading-70 text-2xl font-bold sm:truncate sm:text-3xl sm:tracking-tight",
        className
      )}
    >
      {children}
    </h1>
  );
}
