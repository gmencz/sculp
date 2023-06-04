import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function Paragraph({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <p className={clsx("text-sm leading-6 text-zinc-500", className)}>
      {children}
    </p>
  );
}
