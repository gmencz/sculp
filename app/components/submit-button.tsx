import { useNavigation } from "@remix-run/react";
import { Spinner } from "./spinner";
import clsx from "clsx";

type SubmitButtonProps = {
  text: string;
  value?: string;
  secondary?: boolean;
  isSubmitting?: boolean;
};

export function SubmitButton({
  text,
  value,
  secondary,
  isSubmitting: customIsSubmitting,
}: SubmitButtonProps) {
  const navigation = useNavigation();
  const isSubmitting =
    typeof customIsSubmitting === "boolean"
      ? customIsSubmitting
      : navigation.state === "submitting";

  return (
    <button
      disabled={isSubmitting}
      type="submit"
      value={value}
      className={clsx(
        secondary
          ? "inline-flex w-full items-center justify-center rounded bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
          : "inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {isSubmitting ? <Spinner /> : null}
      {text}
    </button>
  );
}
