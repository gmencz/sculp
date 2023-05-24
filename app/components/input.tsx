import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import clsx from "clsx";
import type { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { ErrorMessage } from "./error-message";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";

type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  config: FieldConfig;
  label: string;
  helperText?: string;
  hideErrorMessage?: boolean;
  hideLabel?: boolean;
  linkAbove?: {
    to: string;
    text: string;
  };
};

export function Input({
  config,
  helperText,
  label,
  hideErrorMessage,
  type,
  hideLabel,
  className,
  linkAbove,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        {hideLabel ? null : (
          <label
            htmlFor={config.id}
            className="mb-1 block text-sm font-medium leading-6 text-zinc-900"
          >
            {label}
          </label>
        )}

        {linkAbove ? (
          <div className="mb-1 text-sm">
            <Link
              to={linkAbove.to}
              className="font-semibold text-orange-600 hover:text-orange-500"
            >
              {linkAbove.text}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="relative rounded-md">
        <input
          className={clsx(
            "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
            config.error
              ? "pr-10 text-red-300 ring-red-500 focus:ring-red-600"
              : "ring-zinc-300 focus:ring-orange-600",
            className
          )}
          aria-label={hideLabel ? label : undefined}
          {...conform.input(config, { type: type || "text" })}
          {...props}
        />

        {config.error ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-500"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>

      {helperText ? (
        <p className="mt-2 text-sm text-zinc-500">{helperText}</p>
      ) : null}

      {config.error && !hideErrorMessage ? (
        <ErrorMessage id={config.errorId}>{config.error}</ErrorMessage>
      ) : null}
    </div>
  );
}
