import { useMatches, useSearchParams } from "@remix-run/react";
import { redirect } from "@remix-run/server-runtime";
import { nanoid } from "nanoid";
import type { DependencyList, EffectCallback, RefObject } from "react";
import { useState } from "react";
import { useCallback } from "react";
import { useEffect, useMemo, useRef } from "react";

import type { User } from "~/models/user.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
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

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.id === "string";
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

export function useModal(name: string, extraParams?: string[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const show =
    searchParams.get("modal") === name &&
    (extraParams
      ? extraParams.every((param) => searchParams.has(param))
      : true);

  const closeModal = () => {
    searchParams.delete("modal");
    extraParams?.forEach((param) => {
      searchParams.delete(param);
    });

    setSearchParams(searchParams);
  };

  return { show, closeModal };
}

export function useSearchParamRef(param: string) {
  const [searchParams] = useSearchParams();
  const currentValue = decodeURIComponent(searchParams.get(param) as string);

  const ref = useRef(currentValue);

  useEffect(() => {
    if (currentValue !== ref.current) {
      ref.current = currentValue;
    }
  }, [currentValue]);

  return ref;
}

export function useDisclosure(buttonRef: RefObject<HTMLButtonElement>) {
  const openPanel = useCallback(() => {
    if (!buttonRef.current) return;

    if (buttonRef.current?.dataset.headlessuiState !== "open") {
      buttonRef.current?.click();
    }
  }, [buttonRef]);

  return { openPanel };
}

export function getRepRangeBounds(repRange: string) {
  // The rep range will have the format:
  // "x-y" or for example "5-8" so we need to extract the bounds.
  const repRangeBounds = repRange.split("-");
  const repRangeLowerBound = Number(repRangeBounds[0]);
  const repRangeUpperBound = Number(repRangeBounds[1]);
  return [repRangeLowerBound, repRangeUpperBound];
}

export function validateRepRange(repRange: string, optional: boolean = false) {
  if (optional && !repRange) {
    return true;
  }

  // Format: 5-8 or 5-10 or even 90-100.
  if (repRange.length > 5 || repRange[1] !== "-") {
    return false;
  }

  const [lowerBoundStr, upperBoundStr] = repRange.split("-");
  const lowerBound = Number(lowerBoundStr);
  const upperBound = Number(upperBoundStr);
  if (Number.isNaN(lowerBound) || Number.isNaN(upperBound)) {
    return false;
  }

  if (lowerBound >= upperBound) {
    return false;
  }

  return true;
}

export function useAfterPaintEffect(
  effect: EffectCallback,
  deps?: DependencyList | undefined
) {
  useEffect(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        effect();
      }, 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function generateId() {
  return nanoid();
}

export function redirectBack(
  request: Request,
  { fallback, ...init }: ResponseInit & { fallback: string }
) {
  const referer = request.headers.get("Referer");
  if (referer) {
    const url = new URL(referer);
    return redirect(url.pathname + url.search, init);
  }
  return redirect(fallback, init);
}

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
