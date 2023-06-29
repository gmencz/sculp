/*
  Warnings:

  - A unique constraint covering the columns `[name,user_id]` on the table `folders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_user_id_key" ON "folders"("name", "user_id");
