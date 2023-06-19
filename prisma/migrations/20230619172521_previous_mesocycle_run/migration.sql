/*
  Warnings:

  - You are about to drop the column `previous_run_id` on the `mesocycles_runs_microcycles_training_days_exercises` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[previous_run_id]` on the table `mesocycles_runs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_previo_fkey";

-- DropIndex
DROP INDEX "mesocycles_runs_microcycles_training_days_exercises_previou_key";

-- AlterTable
ALTER TABLE "mesocycles_runs" ADD COLUMN     "previous_run_id" TEXT;

-- AlterTable
ALTER TABLE "mesocycles_runs_microcycles_training_days" ALTER COLUMN "label" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" DROP COLUMN "previous_run_id";

-- AlterTable
ALTER TABLE "mesocycles_training_days" ALTER COLUMN "label" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_previous_run_id_key" ON "mesocycles_runs"("previous_run_id");

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_previous_run_id_fkey" FOREIGN KEY ("previous_run_id") REFERENCES "mesocycles_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
