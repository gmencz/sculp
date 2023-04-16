/*
  Warnings:

  - You are about to drop the column `description` on the `access_requests` table. All the data in the column will be lost.
  - Added the required column `current_logbook` to the `access_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "access_requests" DROP COLUMN "description",
ADD COLUMN     "current_logbook" TEXT NOT NULL;
