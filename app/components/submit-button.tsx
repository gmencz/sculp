import { useNavigation } from "@remix-run/react";
import { Spinner } from "./spinner";
import clsx from "clsx";
import { classes } from "~/utils/classes";

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
  className,
  ...rest
}: SubmitButtonProps &
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >) {
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
          ? classes.buttonOrLink.secondary
          : classes.buttonOrLink.primary,
        className
      )}
      {...rest}
    >
      {isSubmitting ? <Spinner className="-ml-1 mr-3 h-5 w-5" /> : null}
      {text}
    </button>
  );
}
