import { z } from "zod";
import { idSchema } from "~/utils/schemas";

export enum Intent {
  UPDATE_FOLDER_NOTES = "UPDATE_FOLDER_NOTES",
  RENAME_FOLDER = "RENAME_FOLDER",
  DELETE_FOLDER = "DELETE_FOLDER",
  DELETE_ROUTINE = "DELETE_ROUTINE",
  REORDER_FOLDERS = "REORDER_FOLDERS",
  NEW_FOLDER = "NEW_FOLDER",
}

export const intentSchema = z.object({
  intent: z.nativeEnum(Intent, {
    invalid_type_error: "The intent is not valid.",
    required_error: "The intent is required.",
  }),
});

export type IntentSchema = z.infer<typeof intentSchema>;

export const updateFolderNotesSchema = z.object({
  intent: z
    .literal(Intent.UPDATE_FOLDER_NOTES)
    .default(Intent.UPDATE_FOLDER_NOTES),
  id: idSchema,
  notes: z
    .string({ invalid_type_error: "The notes are not valid." })
    .max(1024, "The notes are too long."),
});

export type UpdateFolderNotesSchema = z.infer<typeof updateFolderNotesSchema>;

export const renameFolderSchema = z.object({
  intent: z.literal(Intent.RENAME_FOLDER).default(Intent.RENAME_FOLDER),
  id: idSchema,
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .max(100, "The name is too long."),
});

export type RenameFolderSchema = z.infer<typeof renameFolderSchema>;

export const newFolderSchema = z.object({
  intent: z.literal(Intent.NEW_FOLDER).default(Intent.NEW_FOLDER),
  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .max(100, "The name is too long."),
});

export type NewFolderSchema = z.infer<typeof newFolderSchema>;

export const deleteFolderSchema = z.object({
  intent: z.literal(Intent.DELETE_FOLDER).default(Intent.DELETE_FOLDER),
  id: idSchema,
});

export type DeleteFolderSchema = z.infer<typeof deleteFolderSchema>;

export const deleteRoutineSchema = z.object({
  intent: z.literal(Intent.DELETE_ROUTINE).default(Intent.DELETE_ROUTINE),
  id: idSchema,
});

export type DeleteRoutineSchema = z.infer<typeof deleteRoutineSchema>;

export const reorderFoldersSchema = z.object({
  intent: z.literal(Intent.REORDER_FOLDERS).default(Intent.REORDER_FOLDERS),
  orderedFoldersIds: z.array(idSchema),
});

export type ReorderFoldersSchema = z.infer<typeof reorderFoldersSchema>;
