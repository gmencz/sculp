import { z } from "zod";

export enum Intent {
  UPDATE_FOLDER_NOTES = "UPDATE_FOLDER_NOTES",
  RENAME_FOLDER = "RENAME_FOLDER",
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

  notes: z
    .string({ invalid_type_error: "The notes are not valid." })
    .max(1024, "The notes are too long."),
});

export type UpdateFolderNotesSchema = z.infer<typeof updateFolderNotesSchema>;

export const renameFolderSchema = z.object({
  intent: z.literal(Intent.RENAME_FOLDER).default(Intent.RENAME_FOLDER),

  name: z
    .string({
      invalid_type_error: "The name is not valid.",
      required_error: "The name is required.",
    })
    .max(100, "The name is too long."),
});

export type RenameFolderSchema = z.infer<typeof renameFolderSchema>;
