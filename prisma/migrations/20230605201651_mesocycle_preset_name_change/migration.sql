/*
  Warnings:

  - You are about to drop the column `userId` on the `mesocycles_presets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `mesocycles_presets` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "mesocycles_presets_name_userId_key";

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mesocycles_presets" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_presets_name_key" ON "mesocycles_presets"("name");
