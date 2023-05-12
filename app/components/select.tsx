import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Fragment, useRef, useState } from "react";
import { ErrorMessage } from "./error-message";

type SelectProps = {
  config: FieldConfig;
  label: string;
  options: (string | number)[];
  helperText?: string;
};

export function Select({ config, label, options, helperText }: SelectProps) {
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
                <span className="block truncate">{value}</span>
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
                            {option}
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
