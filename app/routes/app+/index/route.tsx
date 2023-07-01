import { parse } from "@conform-to/zod";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { AppPageLayout } from "~/components/app-page-layout";
import { Card } from "~/components/card";
import { requireUser } from "~/services/auth/api/require-user";
import { classes } from "~/utils/classes";
import { prisma } from "~/utils/db.server";
import { useResetCallback } from "~/utils/hooks";
import {
  Intent,
  deleteFolderSchema,
  deleteRoutineSchema,
  intentSchema,
  renameFolderSchema,
  updateFolderNotesSchema,
} from "./schema";
import { Folder } from "./folder";
import { redirectBack } from "~/utils/responses.server";
import { configRoutes } from "~/utils/routes";
import { Prisma } from "@prisma/client";
import { FolderOptionsModal } from "./folder-options-modal";
import { RenameFolderModal } from "./rename-folder-modal";
import { DeleteFolderModal } from "./delete-folder-modal";
import { RoutineOptionsModal } from "./routine-options-modal";
import { DeleteRoutineModal } from "./delete-routine-modal";
import { AppPageHeader } from "~/components/app-page-header";
import { commitSession, flashGlobalNotification } from "~/utils/session.server";

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
            orderBy: {
              order: "asc",
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
  const user = await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema: intentSchema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  switch (intentSubmission.value.intent) {
    case Intent.RENAME_FOLDER: {
      const submission = parse(formData, { schema: renameFolderSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      try {
        await prisma.folder.updateMany({
          where: {
            AND: [{ id: submission.value.id }, { userId: user.id }],
          },
          data: {
            name: submission.value.name,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            submission.error["name"] =
              "You already have a folder with this name";

            return json(submission, { status: 400 });
          }
        }
        throw e;
      }

      return redirectBack(request, {
        fallback: configRoutes.app.home,
      });
    }

    case Intent.UPDATE_FOLDER_NOTES: {
      const submission = parse(formData, { schema: updateFolderNotesSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      await prisma.folder.updateMany({
        where: {
          AND: [{ id: submission.value.id }, { userId: user.id }],
        },
        data: {
          notes: submission.value.notes,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.home,
      });
    }

    case Intent.DELETE_FOLDER: {
      const submission = parse(formData, { schema: deleteFolderSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      await prisma.folder.deleteMany({
        where: {
          AND: [{ id: submission.value.id }, { userId: user.id }],
        },
      });

      const session = await flashGlobalNotification(request, {
        message: "Folder successfully deleted!",
        type: "success",
      });

      return redirectBack(request, {
        fallback: configRoutes.app.home,
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }

    case Intent.DELETE_ROUTINE: {
      const submission = parse(formData, { schema: deleteRoutineSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      await prisma.routine.deleteMany({
        where: {
          AND: [{ id: submission.value.id }, { userId: user.id }],
        },
      });

      const session = await flashGlobalNotification(request, {
        message: "Routine successfully deleted!",
        type: "success",
      });

      return redirectBack(request, {
        fallback: configRoutes.app.home,
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  }

  throw new Response("Bad Request", { status: 400 });
};

export type SelectedFolder = {
  id: string;
  name: string;
};

export type SelectedRoutine = {
  id: string;
  name: string;
};

export default function Train() {
  const { folders } = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [showFolderOptionsModal, setShowFolderOptionsModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<SelectedFolder | null>(
    null
  );

  const [showRoutineOptionsModal, setShowRoutineOptionsModal] = useState(false);
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] =
    useState<SelectedRoutine | null>(null);

  useEffect(() => {
    if (
      lastSubmission?.value?.intent === Intent.RENAME_FOLDER &&
      lastSubmission.error.name
    ) {
      setShowRenameFolderModal(true);
    }
  }, [lastSubmission?.error.name, lastSubmission?.value?.intent]);

  const [controlledFolders, setControlledFolders] = useState(folders);

  useResetCallback(folders, () => {
    setControlledFolders(folders);
  });

  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.formData) {
      const intent = navigation.formData.get("intent");

      switch (intent) {
        case Intent.RENAME_FOLDER: {
          const id = navigation.formData.get("id");
          const name = (navigation.formData.get("name") as string) || "";
          setControlledFolders((prev) =>
            prev.map((folder) => {
              if (folder.id === id) {
                return {
                  ...folder,
                  name,
                };
              }

              return folder;
            })
          );
          setShowRenameFolderModal(false);
          break;
        }

        case Intent.DELETE_FOLDER: {
          const id = navigation.formData.get("id");
          setControlledFolders((prev) =>
            prev.filter((folder) => folder.id !== id)
          );
          setShowDeleteFolderModal(false);
          break;
        }

        case Intent.DELETE_ROUTINE: {
          const id = navigation.formData.get("id");
          setControlledFolders((prev) =>
            prev.map((folder) => {
              return {
                ...folder,
                routines: folder.routines.filter(
                  (routine) => routine.id !== id
                ),
              };
            })
          );
          setShowDeleteFolderModal(false);
          break;
        }
      }
    }
  }, [navigation.formData]);

  return (
    <>
      <AppPageHeader pageTitle="Home" />

      <AppPageLayout>
        <Card>
          <h3 className="mb-4 text-lg font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
            Quick Start
          </h3>

          <Link
            to="/app/train"
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

            <Link
              className="-m-2 p-2 text-orange-500 hover:text-orange-600"
              to={`/app/routines/new`}
            >
              <span className="sr-only">New Routine</span>
              <PlusIcon className="h-6 w-6" />
            </Link>
          </div>

          <ol className="flex flex-col gap-2">
            {controlledFolders.map((folder) => (
              <Folder
                key={folder.id}
                folder={folder}
                onClickOptions={(id, name) => {
                  setSelectedFolder({ id, name });
                  setShowFolderOptionsModal(true);
                }}
                onClickRoutineOptions={(id, name) => {
                  setSelectedRoutine({ id, name });
                  setShowRoutineOptionsModal(true);
                }}
              />
            ))}
          </ol>
        </Card>

        <FolderOptionsModal
          selectedFolder={selectedFolder}
          show={showFolderOptionsModal}
          setShow={setShowFolderOptionsModal}
          setShowDeleteFolderModal={setShowDeleteFolderModal}
          setShowRenameFolderModal={setShowRenameFolderModal}
        />

        <RenameFolderModal
          selectedFolder={selectedFolder}
          show={showRenameFolderModal}
          setShow={setShowRenameFolderModal}
        />

        <DeleteFolderModal
          selectedFolder={selectedFolder}
          show={showDeleteFolderModal}
          setShow={setShowDeleteFolderModal}
        />

        <RoutineOptionsModal
          selectedRoutine={selectedRoutine}
          show={showRoutineOptionsModal}
          setShow={setShowRoutineOptionsModal}
          setShowDeleteRoutineModal={setShowDeleteRoutineModal}
        />

        <DeleteRoutineModal
          selectedRoutine={selectedRoutine}
          show={showDeleteRoutineModal}
          setShow={setShowDeleteRoutineModal}
        />
      </AppPageLayout>
    </>
  );
}
