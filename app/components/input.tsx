import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import clsx from "clsx";
import type { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { ErrorMessage } from "./error-message";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  config: FieldConfig<string>;
  label: string;
  helperText?: string;
  hideErrorMessage?: boolean;
  hideLabel?: boolean;
};

export function Input({
  config,
  helperText,
  label,
  hideErrorMessage,
  type,
  hideLabel,
  className,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={config.id}
        className={clsx(
          "mb-1 block text-sm font-medium leading-6 text-zinc-900",
          hideLabel && "sr-only"
        )}
      >
        {label}
      </label>

      <div className="relative rounded-md">
        <input
          className={clsx(
            "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 ring-1 ring-inset placeholder:text-zinc-400 read-only:cursor-not-allowed read-only:bg-zinc-50 read-only:text-zinc-500 read-only:ring-zinc-200 focus:ring-2 focus:ring-inset focus:ring-orange-600",
            config.error
              ? "pr-10 text-red-300 ring-red-500 focus:ring-red-600"
              : "ring-zinc-300 focus:ring-orange-600",
            className
          )}
          {...conform.input(config, { type: type || "text" })}
          {...props}
        />

        {config.error ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center pr-3">
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
