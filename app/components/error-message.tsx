import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function ErrorMessage({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p
      className={clsx("mt-2 text-base text-red-500", className)}
      role="alert"
      {...props}
    >
      {children}
    </p>
  );
}
