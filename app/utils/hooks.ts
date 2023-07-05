import { requestIntent, validate } from "@conform-to/react";
import type { User } from "@prisma/client";
import type { SubmitOptions } from "@remix-run/react";
import { useMatches, useSubmit } from "@remix-run/react";
import type { RefObject } from "react";
import { useCallback, useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";

/**
 * Declarative interval.
 * More info: https://overreacted.io/making-setinterval-declarative-with-react-hooks
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }

    if (delay) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Delay the execution of a function or a state update with useDebounce.
 * @param value The value that you want to debounce.
 * @param delay The delay time in milliseconds. After this amount of time, the latest value is used.
 * @returns The debounced value. After the delay time has passed without the value changing, this will be updated to the latest value.
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Check if a CSS media query matches.
 * @param query The CSS media query.
 * @returns whether the media query matches or not.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}

/**
 * Fallback to a ref if one is not provided to the component forwarding it.
 * @param forwardedRef The ref that might have been forwarded or not.
 * @returns The forwarded ref if it exists, otherwise a fallback ref.
 */
export function useFallbackRef<T>(forwardedRef: RefObject<T>) {
  const fallbackRef = useRef<T>(null);
  return forwardedRef || fallbackRef;
}

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.id === "string";
}

/**
 * Get the current user.
 * @returns The user if it exists or undefined.
 */
export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

export function useDebouncedSubmit(
  form: HTMLFormElement | null,
  options?:
    | (SubmitOptions & { delay?: number; noValidate?: boolean })
    | undefined
) {
  const [submissionNumber, setSubmissionNumber] = useState(0);
  const debouncedSubmissionNumber = useDebounce(
    submissionNumber,
    options?.delay || 1500
  );
  const remixSubmit = useSubmit();

  const submit = useCallback(() => {
    setSubmissionNumber((prev) => prev + 1);
  }, []);

  useDeepCompareEffect(() => {
    if (debouncedSubmissionNumber) {
      if (options?.noValidate) {
        remixSubmit(form, options);
      } else if (form?.reportValidity()) {
        remixSubmit(form, options);
      }
    }
  }, [submit, debouncedSubmissionNumber, remixSubmit, form, options]);

  return submit;
}

export function useResetCallback(
  initialValue: unknown,
  resetFn: () => unknown
) {
  const [prevValue, setPrevValue] = useState(initialValue);
  if (prevValue !== initialValue) {
    resetFn();
    setPrevValue(initialValue);
  }
}
