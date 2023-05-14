import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";
import { ErrorMessage } from "./error-message";

type TextareaProps = {
  config: FieldConfig;
  label: string;
  helperText?: string;
};

export function Textarea({
  config,
  helperText,
  label,
  ...props
}: TextareaProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={config.id}
        className="block text-sm font-medium leading-6 text-zinc-900"
      >
        {label}
      </label>

      <textarea
        className={clsx(
          "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
          config.error
            ? "text-red-300 ring-red-500 focus:ring-red-600"
            : "ring-zinc-300 focus:ring-orange-600"
        )}
        {...props}
        {...conform.textarea(config)}
      />

      {helperText ? (
        <p className="mt-2 text-sm text-zinc-500">{helperText}</p>
      ) : null}

      {config.error ? (
        <ErrorMessage id={config.errorId}>{config.error}</ErrorMessage>
      ) : null}
    </div>
  );
}
