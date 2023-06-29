import { ArrowLongLeftIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";
import type { RemixLinkProps } from "@remix-run/react/dist/components";
import type { PropsWithChildren } from "react";

export function BackLink({
  children,
  to,
  ...props
}: PropsWithChildren<RemixLinkProps>) {
  return (
    <Link
      {...props}
      to={to}
      className="text-basee inline-flex items-center font-semibold leading-7 text-orange-600"
    >
      <ArrowLongLeftIcon
        className="-ml-0.5 mr-1.5 h-5 w-5"
        aria-hidden="true"
      />
      {children}
    </Link>
  );
}
