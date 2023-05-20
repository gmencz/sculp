import type { PropsWithChildren } from "react";

export function Paragraph({ children }: PropsWithChildren) {
  return <p className="text-sm leading-6 text-zinc-500">{children}</p>;
}
