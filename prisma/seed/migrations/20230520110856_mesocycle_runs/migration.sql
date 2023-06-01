/*
  Warnings:

  - You are about to drop the column `currentUserId` on the `mesocycles_runs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[current_user_id]` on the table `mesocycles_runs` will be added. If there are existing duplicate values, this will fail.
  - Made the column `mesoycle_id` on table `mesocycles_runs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_mesoycle_id_fkey";

-- DropIndex
DROP INDEX "mesocycles_runs_currentUserId_key";

-- AlterTable
ALTER TABLE "mesocycles_runs" DROP COLUMN "currentUserId",
ADD COLUMN     "current_user_id" TEXT,
ALTER COLUMN "mesoycle_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "mesocycles_runs_microcycles" (
    "id" TEXT NOT NULL,
    "mesocycle_run_id" TEXT,
    "rest_days" INTEGER[],

    CONSTRAINT "mesocycles_runs_microcycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs_microcycles_training_days" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "microcycle_id" TEXT,

    CONSTRAINT "mesocycles_runs_microcycles_training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs_microcycles_training_days_exercises" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "notes" TEXT,
    "training_day_id" TEXT,
    "exercise_id" TEXT NOT NULL,

    CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" (
    "id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "target_reps_to_complete" INTEGER NOT NULL,
    "reps_completed" INTEGER,
    "number" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rir" INTEGER NOT NULL,
    "rep_range_lower_bound" INTEGER NOT NULL,
    "rep_range_upper_bound" INTEGER NOT NULL,
    "exercise_id" TEXT,

    CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_current_user_id_key" ON "mesocycles_runs"("current_user_id");

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_mesoycle_id_fkey" FOREIGN KEY ("mesoycle_id") REFERENCES "mesocycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_current_user_id_fkey" FOREIGN KEY ("current_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles" ADD CONSTRAINT "mesocycles_runs_microcycles_mesocycle_run_id_fkey" FOREIGN KEY ("mesocycle_run_id") REFERENCES "mesocycles_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_microcycle_id_fkey" FOREIGN KEY ("microcycle_id") REFERENCES "mesocycles_runs_microcycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_traini_fkey" FOREIGN KEY ("training_day_id") REFERENCES "mesocycles_runs_microcycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_exerci_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_e_fkey" FOREIGN KEY ("exercise_id") REFERENCES "mesocycles_runs_microcycles_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
