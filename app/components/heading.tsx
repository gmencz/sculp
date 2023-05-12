import type { PropsWithChildren } from "react";

export function Heading({ children }: PropsWithChildren) {
  return (
    <h1 className="text-2xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-3xl sm:tracking-tight">
      {children}
    </h1>
  );
}
