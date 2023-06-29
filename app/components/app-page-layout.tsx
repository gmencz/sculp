import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function AppPageLayout({
  children,
  className,
}: PropsWithChildren<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>) {
  return (
    <div
      className={clsx("sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-10", className)}
    >
      {children}
    </div>
  );
}
