import type { PropsWithChildren } from "react";

export function Paragraph({ children }: PropsWithChildren) {
  return <p className="mt-2 text-sm leading-6 text-zinc-500">{children}</p>;
}
