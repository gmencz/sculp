import { parse } from "@conform-to/zod";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Link, useLoaderData, useNavigation } from "@remix-run/react";
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
  newFolderSchema,
  renameFolderSchema,
  reorderFoldersSchema,
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
import { ReorderFoldersModal } from "./reorder-folders-modal";
import { NewRoutineModal } from "./new-routine-modal";
import { NewFolderModal } from "./new-folder-modal";
import { generateId } from "~/utils/ids";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const folders = await prisma.folder.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      order: true,
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
      order: "asc",
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

    case Intent.REORDER_FOLDERS: {
      const submission = parse(formData, { schema: reorderFoldersSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { orderedFoldersIds } = submission.value;
      const currentOrderedFolders = await prisma.folder.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
        },
      });

      const foldersToUpdate = orderedFoldersIds.filter(
        (id, index) => currentOrderedFolders[index]?.id !== id
      );

      if (!foldersToUpdate) {
        return redirectBack(request, {
          fallback: configRoutes.app.home,
        });
      }

      await prisma.$transaction(
        foldersToUpdate.map((id, index) =>
          prisma.folder.update({
            where: {
              id,
            },
            data: {
              order: index + 1,
            },
          })
        )
      );

      return redirectBack(request, {
        fallback: configRoutes.app.home,
      });
    }

    case Intent.NEW_FOLDER: {
      const submission = parse(formData, { schema: newFolderSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const lastFolder = await prisma.folder.findFirst({
        where: {
          userId: user.id,
        },
        select: {
          order: true,
        },
        orderBy: {
          order: "desc",
        },
      });

      try {
        await prisma.folder.create({
          data: {
            name: submission.value.name,
            user: { connect: { id: user.id } },
            order: lastFolder ? lastFolder.order + 1 : 1,
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
  const [showFolderOptionsModal, setShowFolderOptionsModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showReorderFoldersModal, setShowReorderFoldersModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<SelectedFolder | null>(
    null
  );

  const [showRoutineOptionsModal, setShowRoutineOptionsModal] = useState(false);
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);
  const [showNewRoutineModal, setShowNewRoutineModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] =
    useState<SelectedRoutine | null>(null);

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
          const existingName = folders.some((folder) => folder.name === name);
          if (!existingName) {
            setControlledFolders((folders) =>
              folders.map((folder) => {
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
          }
          break;
        }

        case Intent.DELETE_FOLDER: {
          const id = navigation.formData.get("id");
          setControlledFolders((folders) =>
            folders.filter((folder) => folder.id !== id)
          );
          setShowDeleteFolderModal(false);
          break;
        }

        case Intent.DELETE_ROUTINE: {
          const id = navigation.formData.get("id");
          setControlledFolders((folders) =>
            folders.map((folder) => {
              return {
                ...folder,
                routines: folder.routines.filter(
                  (routine) => routine.id !== id
                ),
              };
            })
          );
          setShowDeleteRoutineModal(false);
          break;
        }

        case Intent.REORDER_FOLDERS: {
          const result = parse(navigation.formData, {
            schema: reorderFoldersSchema,
          });

          if (result.value) {
            const { orderedFoldersIds } = result.value;
            setControlledFolders((folders) => {
              return folders
                .map((folder, index) => {
                  const orderIndex = orderedFoldersIds.findIndex(
                    (id) => id === folder.id
                  );

                  return {
                    ...folder,
                    order: orderIndex !== -1 ? orderIndex + 1 : folder.order,
                  };
                })
                .sort((a, b) => a.order - b.order);
            });

            setShowReorderFoldersModal(false);
            break;
          }
        }

        case Intent.NEW_FOLDER: {
          const name = (navigation.formData.get("name") as string) || "";
          const existingName = folders.some((folder) => folder.name === name);
          if (!existingName) {
            setControlledFolders((folders) => {
              const lastFolder = folders.at(-1);

              return [
                ...folders,
                {
                  id: `temp-new-${generateId()}`,
                  name,
                  notes: null,
                  order: lastFolder ? lastFolder.order + 1 : 1,
                  routines: [],
                },
              ];
            });

            setShowNewFolderModal(false);
          }

          break;
        }
      }
    }
  }, [folders, navigation.formData]);

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

            <button
              onClick={() => {
                setShowNewRoutineModal(true);
              }}
              className="-m-2 p-2 text-orange-500 hover:text-orange-600"
            >
              <span className="sr-only">New Routine</span>
              <PlusIcon className="h-6 w-6" />
            </button>
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
          setShowReorderFoldersModal={setShowReorderFoldersModal}
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

        <ReorderFoldersModal
          folders={folders}
          show={showReorderFoldersModal}
          setShow={setShowReorderFoldersModal}
        />

        <NewRoutineModal
          folders={folders}
          show={showNewRoutineModal}
          setShow={setShowNewRoutineModal}
          setShowNewFolderModal={setShowNewFolderModal}
        />

        <NewFolderModal
          show={showNewFolderModal}
          setShow={setShowNewFolderModal}
        />
      </AppPageLayout>
    </>
  );
}
