import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { ErrorMessage } from "./error-message";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

type TextareaProps = {
  config: FieldConfig;
  label: string;
  helperText?: string;
  hideErrorMessage?: boolean;
  hideLabel?: boolean;
  autoSize?: boolean;
};

export function Textarea({
  config,
  helperText,
  label,
  hideLabel = false,
  hideErrorMessage = false,
  className,
  autoSize = false,
  onChange,
  ...props
}: TextareaProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (textAreaRef.current && autoSize) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;

      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [autoSize, value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  return (
    <div className="flex flex-col">
      {hideLabel ? null : (
        <label
          htmlFor={config.id}
          className="mb-1 block text-sm font-medium leading-6 text-zinc-900"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-md">
        <textarea
          ref={textAreaRef}
          onChange={(event) => {
            onChange?.(event);
            if (autoSize) {
              handleChange(event);
            }
          }}
          className={clsx(
            "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
            config.error
              ? "text-red-300 ring-red-500 focus:ring-red-600"
              : "ring-zinc-300 focus:ring-orange-600",
            className
          )}
          aria-label={hideLabel ? label : undefined}
          {...props}
          {...conform.textarea(config)}
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
