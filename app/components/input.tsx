import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import clsx from "clsx";
import type { InputHTMLAttributes } from "react";
import { ErrorMessage } from "./error-message";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

type InputProps = {
  config: FieldConfig;
  label: string;
  helperText?: string;
  hideErrorMessage?: boolean;
};

export function Input({
  config,
  helperText,
  label,
  hideErrorMessage,
  type,
  ...props
}: InputProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="block text-sm font-medium leading-6 text-zinc-900">
        {label}
      </label>

      <div className="relative mt-1 rounded-md">
        <input
          className={clsx(
            "block w-full rounded-md border-0 py-1.5 pr-10 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
            config.error
              ? "text-red-300 ring-red-500 focus:ring-red-600"
              : "ring-zinc-300 focus:ring-orange-600"
          )}
          {...props}
          {...conform.input(config, { type: type || "text" })}
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
        <ErrorMessage>{config.error}</ErrorMessage>
      ) : null}
    </div>
  );
}
