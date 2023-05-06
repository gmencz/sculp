/*
  Warnings:

  - You are about to drop the column `user_id` on the `mesocycles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currentUserId]` on the table `mesocycles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "mesocycles" DROP CONSTRAINT "mesocycles_user_id_fkey";

-- AlterTable
ALTER TABLE "mesocycles" DROP COLUMN "user_id",
ADD COLUMN     "currentUserId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_currentUserId_key" ON "mesocycles"("currentUserId");

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
