import type { HTMLAttributes, PropsWithChildren } from "react";

export function ErrorMessage({
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className="mt-2 text-sm text-red-500" role="alert" {...props}>
      {children}
    </p>
  );
}
