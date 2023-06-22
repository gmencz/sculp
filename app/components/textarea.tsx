import type { FieldConfig } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { conform } from "@conform-to/react";
import clsx from "clsx";
import type { RefObject, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { useState } from "react";
import { ErrorMessage } from "./error-message";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ContentEditable from "react-contenteditable";
import { useFallbackRef } from "~/utils/hooks";

type TextareaProps = {
  config: FieldConfig<string>;
  label: string;
  helperText?: string;
  hideErrorMessage?: boolean;
  hideLabel?: boolean;
  autoSize?: boolean;
  onChangeValue?: (value: string) => void;
};

export const Textarea = forwardRef<
  HTMLElement | HTMLTextAreaElement,
  TextareaProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(
  {
    config,
    helperText,
    label,
    hideLabel = false,
    hideErrorMessage = false,
    className,
    autoSize = false,
    onChangeValue,
    placeholder,
    ...props
  }: TextareaProps &
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange">,
  forwardedRef
) {
  const [value, setValue] = useState<string>(config.defaultValue ?? "");
  const contentEditableRef = useFallbackRef(
    forwardedRef as RefObject<HTMLElement>
  );
  const [ref, control] = useInputEvent({
    onReset: () => setValue(config.defaultValue ?? ""),
  });

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
        {autoSize ? (
          <>
            <input
              ref={ref}
              {...conform.input(config, { hidden: true })}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => contentEditableRef.current?.focus()}
            />

            <ContentEditable
              className={clsx(
                "block w-full rounded-md bg-zinc-200/30 border-0 px-3 py-2.5 text-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-600",
                config.error
                  ? "text-red-300 ring-red-500 focus:ring-red-600"
                  : "ring-zinc-200/30 focus:ring-orange-600",
                value ? "text-zinc-900" : "text-zinc-400",
                className
              )}
              innerRef={forwardedRef || contentEditableRef}
              html={value}
              placeholder={placeholder}
              onChange={(e) => {
                control.change(e);
                onChangeValue?.(e.target.value);
              }}
              onBlur={control.blur}
            />
          </>
        ) : (
          <textarea
            className={clsx(
              "block w-full rounded-md border-0 py-2 text-sm text-zinc-900 ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600",
              config.error
                ? "text-red-300 ring-red-500 focus:ring-red-600"
                : "ring-zinc-300 focus:ring-orange-600",
              autoSize ? "resize-none" : null,
              className
            )}
            ref={forwardedRef as React.ForwardedRef<HTMLTextAreaElement>}
            placeholder={placeholder}
            aria-label={hideLabel ? label : undefined}
            onChange={(e) => {
              onChangeValue?.(e.target.value);
            }}
            {...props}
            {...conform.textarea(config)}
          />
        )}

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
});
