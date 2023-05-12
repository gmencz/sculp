import { useNavigation } from "@remix-run/react";
import { Spinner } from "./spinner";

type SubmitButtonProps = {
  text: string;
};

export function SubmitButton({ text }: SubmitButtonProps) {
  const isSubmitting = useNavigation().state === "submitting";

  return (
    <button
      disabled={isSubmitting}
      type="submit"
      className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isSubmitting ? <Spinner /> : null}
      {text}
    </button>
  );
}
