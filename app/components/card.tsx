import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto mb-4 w-full max-w-2xl bg-white px-4 py-6 dark:bg-zinc-950 sm:rounded-md">
      {children}
    </div>
  );
}
