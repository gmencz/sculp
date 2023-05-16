import type { FieldConfig } from "@conform-to/react";
import { list, requestIntent } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import type { RefObject } from "react";
import { Fragment, useRef, useState } from "react";
import { ErrorMessage } from "./error-message";
import { capitalize } from "~/utils";

type SelectProps = {
  config: FieldConfig;
  label: string;
  options: (string | number)[];
  helperText?: string;
  capitalizeOptions?: boolean;
  multipleOptions?: {
    formRef: RefObject<HTMLFormElement>;
    min: number;
    max: number;
    list: ({
      key: string;
    } & FieldConfig<string | number>)[];
  };
};

function SelectSingleOption({
  config,
  label,
  helperText,
  capitalizeOptions,
  options,
}: Omit<SelectProps, "multipleOptions">) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState(config.defaultValue ?? "");
  const [ref, control] = useInputEvent({
    onReset: () => setValue(config.defaultValue ?? ""),
  });

  return (
    <div>
      <input
        ref={ref}
        {...conform.input(config, { hidden: true })}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => buttonRef.current?.focus()}
      />

      <Listbox
        value={value}
        onChange={(value) => control.change({ target: { value } })}
      >
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
              {label}
            </Listbox.Label>

            <div className="relative mt-2">
              <Listbox.Button
                ref={buttonRef}
                className={clsx(
                  "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600",
                  config.error
                    ? "text-red-300 ring-red-500 focus:ring-red-600"
                    : "focus:ring-orange-600"
                )}
              >
                <span className="block truncate">
                  {capitalizeOptions ? capitalize(value) : value}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-zinc-400"
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option}
                      className={({ active }) =>
                        clsx(
                          active ? "bg-orange-600 text-white" : "text-zinc-900",
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
              <p className="mt-2 text-sm text-zinc-500">{helperText}</p>
            ) : null}
          </>
        )}
      </Listbox>

      {config.error ? (
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
}: SelectProps) {
  const multipleOptionsSettings = multipleOptions!;

  const [selectedOptions, setSelectedOptions] = useState<(string | number)[]>(
    config.defaultValue ?? []
  );

  const onChange = (newSelected: string[]) => {
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

      <Listbox value={selectedOptions} onChange={onChange} multiple>
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium leading-6 text-zinc-900">
              {label}
            </Listbox.Label>

            <div className="relative mt-2">
              <Listbox.Button
                className={clsx(
                  "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-600",
                  config.error
                    ? "text-red-300 ring-red-500 focus:ring-red-600"
                    : "focus:ring-orange-600"
                )}
              >
                <span className="block truncate">
                  {capitalizeOptions
                    ? selectedOptions
                        .map((option) => capitalize(option.toString()))
                        .join(", ")
                    : selectedOptions.join(", ")}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-zinc-400"
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option}
                      className={({ active }) =>
                        clsx(
                          active ? "bg-orange-600 text-white" : "text-zinc-900",
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
              <p className="mt-2 text-sm text-zinc-500">{helperText}</p>
            ) : null}
          </>
        )}
      </Listbox>

      {config.error ? (
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
}: SelectProps) {
  if (!multipleOptions) {
    return (
      <SelectSingleOption
        config={config}
        label={label}
        options={options}
        helperText={helperText}
        capitalizeOptions={capitalizeOptions}
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
    />
  );
}
