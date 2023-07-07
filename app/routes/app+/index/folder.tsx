import { Disclosure } from "@headlessui/react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import type { action, loader } from "./route";
import { ChevronUpIcon, EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { conform, useForm } from "@conform-to/react";
import {
  Intent,
  updateFolderNotesSchema,
  type UpdateFolderNotesSchema,
} from "./schema";
import { Form, Link, useActionData } from "@remix-run/react";
import { parse } from "@conform-to/zod";
import { Textarea } from "~/components/textarea";
import { useDebouncedSubmit } from "~/utils/hooks";
import { configRoutes } from "~/utils/routes";

type FolderProps = {
  folder: SerializeFrom<typeof loader>["folders"][number];
  onClickOptions: (id: string, name: string) => void;
  onClickRoutineOptions: (id: string, name: string) => void;
};

export function Folder({
  folder,
  onClickOptions,
  onClickRoutineOptions,
}: FolderProps) {
  const lastSubmission = useActionData<typeof action>();
  const [updateFolderNotesForm, { notes, intent, id }] =
    useForm<UpdateFolderNotesSchema>({
      id: "update-folder-notes",
      lastSubmission,
      shouldValidate: "onInput",
      defaultValue: {
        id: folder.id,
        notes: folder.notes,
        intent: Intent.UPDATE_FOLDER_NOTES,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: updateFolderNotesSchema });
      },
    });

  const submit = useDebouncedSubmit(updateFolderNotesForm.ref.current, {
    preventScrollReset: true,
    replace: true,
  });

  return (
    <Disclosure as="li">
      {({ open }) => (
        <>
          <div className="flex items-center gap-4">
            <Disclosure.Button className="flex w-full items-center gap-2 rounded-lg py-2 text-left text-base font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <ChevronUpIcon
                className={`${
                  open ? "rotate-180 transform" : "rotate-90"
                } h-6 w-6 text-orange-500 transition-transform`}
              />
              <span>
                {folder.name} ({folder.routines.length})
              </span>
            </Disclosure.Button>

            <button
              className="-m-2 p-2 text-zinc-950 hover:text-zinc-900 dark:text-white dark:hover:text-zinc-50"
              onClick={() => onClickOptions(folder.id, folder.name)}
            >
              <EllipsisVerticalIcon className="h-6 w-6" />
              <span className="sr-only">Options</span>
            </button>
          </div>
          <Disclosure.Panel className="pb-2">
            {folder.notes ? (
              <Form
                replace
                preventScrollReset
                className="mb-4 mt-2"
                method="post"
                onChange={submit}
                {...updateFolderNotesForm.props}
              >
                <input {...conform.input(intent, { hidden: true })} />
                <input {...conform.input(id, { hidden: true })} />

                <Textarea
                  label="Notes"
                  hideLabel
                  hideErrorMessage
                  autoSize
                  config={notes}
                  placeholder="Notes"
                />
              </Form>
            ) : null}

            <ul className="flex flex-col gap-4">
              {folder.routines.map((routine) => (
                <li
                  key={routine.id}
                  className="relative rounded-md border border-zinc-200 text-base dark:border-zinc-800"
                >
                  <Link
                    to={
                      routine.exercises.length > 0
                        ? configRoutes.app.viewRoutine(routine.id)
                        : configRoutes.app.editRoutine(routine.id)
                    }
                    className="block rounded-md p-4 hover:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{routine.name}</span>
                    </div>

                    {routine.exercises.length > 0 ? (
                      <ol className="mt-2">
                        {routine.exercises.map((exercise) => (
                          <li
                            className="text-zinc-700 dark:text-zinc-300"
                            key={exercise.id}
                          >
                            {exercise._count.sets} x {exercise.exercise.name}
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {routine.notes ? (
                      <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                        {routine.notes}
                      </p>
                    ) : null}
                  </Link>

                  <button
                    className="absolute right-4 top-4 -m-2 p-2 text-zinc-950 hover:text-zinc-900 dark:text-white dark:hover:text-zinc-50"
                    onClick={() =>
                      onClickRoutineOptions(routine.id, routine.name)
                    }
                  >
                    <EllipsisVerticalIcon className="h-6 w-6" />
                    <span className="sr-only">Options</span>
                  </button>
                </li>
              ))}
            </ul>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
