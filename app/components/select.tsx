import type { FieldConfig } from "@conform-to/react";
import { list, requestIntent } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { RefObject } from "react";
import { useMemo } from "react";
import { useEffect } from "react";
import { Fragment, useRef, useState } from "react";
import { ErrorMessage } from "./error-message";
import { capitalize } from "~/utils/strings";

type SelectProps = {
  config: FieldConfig<any>;
  label: string;
  hideLabel?: boolean;
  hideErrorMessage?: boolean;
  options: string[];
  helperText?: string;
  disabled?: boolean;
  capitalizeOptions?: boolean;
  onChange?: (value: any) => void;
  controlledValue?: string;
  multipleOptions?: {
    formRef: RefObject<HTMLFormElement>;
    min: number;
    max: number;
    emptyOption?: string;
    list: ({
      key: string;
    } & FieldConfig<string>)[];
  };
};

function SelectSingleOption({
  config,
  label,
  helperText,
  capitalizeOptions,
  options,
  onChange,
  disabled,
  controlledValue,
  hideLabel,
  hideErrorMessage,
}: Omit<SelectProps, "multipleOptions">) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState(config.defaultValue ?? "");

  const [ref, control] = useInputEvent({
    onReset: () => setValue(config.defaultValue ?? ""),
  });

  useEffect(() => {
    if (controlledValue) {
      control.change({ target: { value: controlledValue.toString() } });
    }
  }, [control, controlledValue]);

  return (
    <div>
      <input
        ref={ref}
        {...conform.input(config, { hidden: true })}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => buttonRef.current?.focus()}
      />

      <Listbox
        disabled={disabled}
        value={value}
        onChange={(value) => {
          control.change({ target: { value } });
          onChange?.(value);
        }}
      >
        {({ open }) => (
          <>
            <Listbox.Label
              className={clsx(
                "block text-base font-medium leading-6 text-zinc-900 dark:text-zinc-50",
                hideLabel && "sr-only"
              )}
            >
              {label}
            </Listbox.Label>

            <div className="relative mt-2">
              <Listbox.Button
                ref={buttonRef}
                className={clsx(
                  "relative w-full cursor-default rounded-md bg-transparent bg-white py-2 pl-3 pr-10 text-left text-base text-zinc-900 ring-1 ring-inset focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:disabled:ring-zinc-700",
                  config.error
                    ? "text-red-300 ring-red-500 focus:ring-red-600"
                    : "ring-zinc-300 focus:ring-orange-600 dark:ring-zinc-700"
                )}
              >
                <span className="block truncate">
                  {capitalizeOptions ? capitalize(value) : value}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-zinc-400 dark:text-zinc-600"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-zinc-900/5 focus:outline-none dark:bg-zinc-950 dark:ring-zinc-50/5">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option}
                      className={({ active }) =>
                        clsx(
                          active
                            ? "bg-orange-600 text-white"
                            : "text-zinc-900 dark:text-zinc-50",
                          "relative cursor-default select-none py-2 pl-3 pr-9"
                        )
                      }
                      value={option}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={clsx(
                              selected ? "font-semibold" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {capitalizeOptions
                              ? capitalize(option.toString())
                              : option}
                          </span>

                          {selected ? (
                            <span
                              className={clsx(
                                active ? "text-white" : "text-orange-600",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>

            {helperText ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">
                {helperText}
              </p>
            ) : null}
          </>
        )}
      </Listbox>

      {config.error && !hideErrorMessage ? (
        <ErrorMessage id={config.errorId}>{config.error}</ErrorMessage>
      ) : null}
    </div>
  );
}

function SelectMultipleOptions({
  config,
  label,
  options,
  capitalizeOptions,
  helperText,
  multipleOptions,
  onChange,
  disabled,
  hideLabel,
  hideErrorMessage,
}: SelectProps) {
  const multipleOptionsSettings = multipleOptions!;
  const emptyOption = multipleOptionsSettings.emptyOption || "Please select";

  const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
    config.defaultValue ?? []
  );

  const handleChange = (newSelected: (string | number)[]) => {
    if (
      newSelected.length < multipleOptionsSettings.min ||
      newSelected.length > multipleOptionsSettings.max ||
      newSelected.length === 0
    ) {
      return;
    }

    if (newSelected.length > multipleOptionsSettings.list.length) {
      requestIntent(
        multipleOptionsSettings.formRef.current!,
        list.append(config.name, {
          defaultValue: newSelected.at(-1),
        })
      );
    } else if (newSelected.length < multipleOptionsSettings.list.length) {
      const indexToRemove = multipleOptionsSettings.list.findIndex(
        (v) => !newSelected.includes(v.defaultValue!)
      );

      requestIntent(
        multipleOptionsSettings.formRef.current!,
        list.remove(config.name, { index: indexToRemove })
      );
    }

    setSelectedOptions(newSelected);
  };

  const hasNumericOptions = typeof options[0] === "number";
  const listValues = useMemo(
    () => multipleOptionsSettings.list.map(({ defaultValue }) => defaultValue),
    [multipleOptionsSettings.list]
  );

  // Make sure both list values and selected options are in sync.
  useEffect(() => {
    if (JSON.stringify(listValues) !== JSON.stringify(selectedOptions)) {
      setSelectedOptions(
        multipleOptionsSettings.list.map(({ defaultValue }) =>
          hasNumericOptions ? Number(defaultValue!) : defaultValue!
        )
      );
    }
  }, [
    hasNumericOptions,
    listValues,
    multipleOptionsSettings.list,
    selectedOptions,
    selectedOptions.length,
  ]);

  return (
    <div>
      {multipleOptionsSettings.list.map((item, index) => (
        <Fragment key={item.key}>
          <input
            {...conform.input(item, { hidden: true })}
            id={`${item.form}-${item.name}`}
          />
        </Fragment>
      ))}

      <Listbox
        value={selectedOptions}
        onChange={(value) => {
          handleChange(value);
          onChange?.(value);
        }}
        multiple
        disabled={disabled}
      >
        {({ open }) => (
          <>
            <Listbox.Label
              className={clsx(
                "block text-base font-medium leading-6 text-zinc-900 dark:text-zinc-50",
                hideLabel && "sr-only"
              )}
            >
              {label}
            </Listbox.Label>

            <div className="relative mt-2">
              <Listbox.Button
                className={clsx(
                  "relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-base text-zinc-900 ring-1 ring-inset focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:disabled:ring-zinc-700",
                  config.error
                    ? "text-red-300 ring-red-500 focus:ring-red-600"
                    : "ring-zinc-300 focus:ring-orange-600 dark:ring-zinc-700"
                )}
              >
                <span className="block truncate">
                  {selectedOptions.length
                    ? capitalizeOptions
                      ? selectedOptions
                          .map((option) => capitalize(option.toString()))
                          .join(", ")
                      : selectedOptions.join(", ")
                    : emptyOption}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-zinc-400 dark:text-zinc-600"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-zinc-900/5 focus:outline-none dark:bg-zinc-950 dark:ring-zinc-50/5">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option}
                      className={({ active }) =>
                        clsx(
                          active
                            ? "bg-orange-600 text-zinc-50"
                            : "text-zinc-900 dark:text-zinc-50",
                          "relative cursor-default select-none py-2 pl-3 pr-9"
                        )
                      }
                      value={option}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={clsx(
                              selected ? "font-semibold" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {capitalizeOptions
                              ? capitalize(option.toString())
                              : option}
                          </span>

                          {selected ? (
                            <span
                              className={clsx(
                                active ? "text-zinc-50" : "text-orange-600",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>

            {helperText ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">
                {helperText}
              </p>
            ) : null}
          </>
        )}
      </Listbox>

      {config.error && !hideErrorMessage ? (
        <ErrorMessage id={config.errorId}>{config.error}</ErrorMessage>
      ) : null}
    </div>
  );
}

export function Select({
  config,
  label,
  options,
  helperText,
  capitalizeOptions,
  multipleOptions,
  disabled,
  onChange,
  hideLabel,
  hideErrorMessage,
}: SelectProps) {
  if (!multipleOptions) {
    return (
      <SelectSingleOption
        config={config}
        label={label}
        options={options}
        helperText={helperText}
        capitalizeOptions={capitalizeOptions}
        disabled={disabled}
        onChange={onChange}
        hideLabel={hideLabel}
        hideErrorMessage={hideErrorMessage}
      />
    );
  }

  return (
    <SelectMultipleOptions
      config={config}
      label={label}
      options={options}
      helperText={helperText}
      capitalizeOptions={capitalizeOptions}
      multipleOptions={multipleOptions}
      disabled={disabled}
      onChange={onChange}
      hideLabel={hideLabel}
      hideErrorMessage={hideErrorMessage}
    />
  );
}
