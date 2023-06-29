import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function Paragraph({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <p
      className={clsx(
        "text-base leading-6 text-zinc-500 dark:text-zinc-200",
        className
      )}
    >
      {children}
    </p>
  );
}
