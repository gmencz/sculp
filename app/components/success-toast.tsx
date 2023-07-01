import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import type { Toast } from "react-hot-toast";
import { toast } from "react-hot-toast";

interface SuccessToastProps {
  t: Toast;
  description: string;
}

export function SuccessToast({ t, description }: SuccessToastProps) {
  return (
    <div
      className={clsx(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-950",
        t.visible ? "animate-enter" : "animate-leave"
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircleIcon
              className="h-6 w-6 text-green-500"
              aria-hidden="true"
            />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-base text-zinc-950 dark:text-white">
              {description}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="-m-2 inline-flex rounded-md bg-white p-2 text-zinc-950 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              onClick={() => {
                toast.dismiss(t.id);
              }}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
