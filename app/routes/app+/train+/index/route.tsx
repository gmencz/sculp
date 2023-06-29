import { parse } from "@conform-to/zod";
import { Dialog, Transition } from "@headlessui/react";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { classes } from "~/utils/classes";
import { prisma } from "~/utils/db.server";
import type { MatchWithHeader } from "~/utils/hooks";
import type { RenameFolderSchema } from "./schema";
import { Intent, intentSchema, renameFolderSchema } from "./schema";
import { Folder } from "./folder";
import { conform, useForm } from "@conform-to/react";
import { Input } from "~/components/input";

export const handle: MatchWithHeader = {
  header: () => "Train",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const folders = await prisma.folder.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      notes: true,
      routines: {
        select: {
          id: true,
          name: true,
          notes: true,
          exercises: {
            select: {
              id: true,
              exercise: { select: { name: true } },
              _count: { select: { sets: true } },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ folders });
};

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema: intentSchema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  throw new Error("Not implemented");
};

type SelectedFolder = {
  id: string;
  name: string;
};

export default function Train() {
  const { folders } = useLoaderData<typeof loader>();
  const [showFolderOptionsModal, setShowFolderOptionsModal] = useState(false);
  const [selectedFolderOptions, setSelectedFolderOptions] =
    useState<SelectedFolder | null>(null);

  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [selectedFolderRename, setSelectedFolderRename] =
    useState<SelectedFolder | null>(null);

  useEffect(() => {
    if (selectedFolderOptions) {
      setShowFolderOptionsModal(true);
    }
  }, [selectedFolderOptions]);

  useEffect(() => {
    if (selectedFolderRename) {
      setShowFolderOptionsModal(false);
      setShowRenameFolderModal(true);
    }
  }, [selectedFolderRename, showRenameFolderModal]);

  return (
    <AppPageLayout>
      <Card>
        <h3 className="mb-4 text-lg font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
          Quick Start
        </h3>

        <Link
          to="./empty"
          className={clsx(classes.buttonOrLink.primary, "w-full")}
        >
          <PlusIcon className="h-5 w-5" />
          Start Empty Session
        </Link>
      </Card>

      <Card>
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-lg font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
            Routines
          </h3>

          <Link className="-m-2 p-2" to={`/routines/new`}>
            <span className="sr-only">New Routine</span>
            <PlusIcon className="h-7 w-7 text-orange-500" />
          </Link>
        </div>

        <ol className="flex flex-col gap-2">
          {folders.map((folder) => (
            <Folder
              key={folder.id}
              folder={folder}
              onClickOptions={(id, name) =>
                setSelectedFolderOptions({ id, name })
              }
            />
          ))}
        </ol>
      </Card>

      <Transition.Root
        afterLeave={() => {
          setSelectedFolderOptions(null);
        }}
        show={showFolderOptionsModal}
        as={Fragment}
      >
        <Dialog
          onClose={() => setShowFolderOptionsModal(false)}
          as="div"
          className="relative z-[60]"
          unmount
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity dark:bg-zinc-900 dark:bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative flex w-full transform flex-col overflow-hidden rounded-lg bg-white text-left text-zinc-950 shadow-xl transition-all dark:bg-zinc-950 dark:text-white sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <span>{selectedFolderOptions?.name}</span>
                    <button
                      onClick={() => setShowFolderOptionsModal(false)}
                      className="-m-2 p-2"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFolderRename(selectedFolderOptions);
                    }}
                    className="flex w-full items-center justify-start gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800"
                  >
                    <PencilIcon className="h-6 w-6" />
                    <span>Rename Folder</span>
                  </button>

                  <button className="flex w-full items-center justify-start gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <PlusIcon className="-ml-1 h-6 w-6" />
                    <span>Add New Routine</span>
                  </button>

                  <button className="flex w-full items-center justify-start gap-6 px-6 py-4 text-red-500 dark:border-zinc-800">
                    <TrashIcon className="-ml-1 h-6 w-6" />
                    <span>Delete Folder</span>
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root
        afterLeave={() => {
          setSelectedFolderOptions(null);
        }}
        show={showRenameFolderModal}
        as={Fragment}
      >
        <Dialog
          onClose={() => setShowRenameFolderModal(false)}
          as="div"
          className="relative z-[60]"
          unmount
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity dark:bg-zinc-900 dark:bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative flex w-full transform flex-col overflow-hidden rounded-lg bg-white text-left text-zinc-950 shadow-xl transition-all dark:bg-zinc-950 dark:text-white sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  {selectedFolderRename ? (
                    <RenameFolderForm
                      folderName={selectedFolderRename?.name}
                      setShowRenameFolderModal={setShowRenameFolderModal}
                    />
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </AppPageLayout>
  );
}

type RenameFolderFormProps = {
  folderName: string;
  setShowRenameFolderModal: (value: React.SetStateAction<boolean>) => void;
};

function RenameFolderForm({
  folderName,
  setShowRenameFolderModal,
}: RenameFolderFormProps) {
  const lastSubmission = useActionData<typeof action>();
  const [renameFolderForm, { intent, name }] = useForm<RenameFolderSchema>({
    id: "rename-folder",
    lastSubmission,
    shouldValidate: "onInput",
    defaultValue: {
      name: folderName,
      intent: Intent.RENAME_FOLDER,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: renameFolderSchema });
    },
  });

  return (
    <Form method="post" preventScrollReset replace {...renameFolderForm.props}>
      <div className="flex w-full items-center justify-between gap-6 px-6 py-4 dark:border-zinc-800">
        <input {...conform.input(intent, { hidden: true })} />

        <Input config={name} hideLabel label="Name" />

        <button
          type="button"
          onClick={() => setShowRenameFolderModal(false)}
          className="-m-2 p-2"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
    </Form>
  );
}
