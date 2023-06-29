/*
  Warnings:

  - You are about to drop the column `notes` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the `_ExerciseToMuscleGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycle_training_days_exercises` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycle_training_days_exercises_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_presets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_runs_microcycles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_runs_microcycles_training_days` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_runs_microcycles_training_days_exercises` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_runs_microcycles_training_days_exercises_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mesocycles_training_days` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" DROP CONSTRAINT "_ExerciseToMuscleGroup_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" DROP CONSTRAINT "_ExerciseToMuscleGroup_B_fkey";

-- DropForeignKey
ALTER TABLE "mesocycle_training_days_exercises" DROP CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycle_training_days_exercises" DROP CONSTRAINT "mesocycle_training_days_exercises_mesocycle_training_day_i_fkey";

-- DropForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" DROP CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycle_training__fkey";

-- DropForeignKey
ALTER TABLE "mesocycles" DROP CONSTRAINT "mesocycles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_current_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_mesoycle_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_previous_run_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_ran_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles" DROP CONSTRAINT "mesocycles_runs_microcycles_mesocycle_run_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_microcycle_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_exerci_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_traini_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_e_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_training_days" DROP CONSTRAINT "mesocycles_training_days_mesocyclePresetId_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_training_days" DROP CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey";

-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "notes";

-- DropTable
DROP TABLE "_ExerciseToMuscleGroup";

-- DropTable
DROP TABLE "mesocycle_training_days_exercises";

-- DropTable
DROP TABLE "mesocycle_training_days_exercises_sets";

-- DropTable
DROP TABLE "mesocycles";

-- DropTable
DROP TABLE "mesocycles_presets";

-- DropTable
DROP TABLE "mesocycles_runs";

-- DropTable
DROP TABLE "mesocycles_runs_microcycles";

-- DropTable
DROP TABLE "mesocycles_runs_microcycles_training_days";

-- DropTable
DROP TABLE "mesocycles_runs_microcycles_training_days_exercises";

-- DropTable
DROP TABLE "mesocycles_runs_microcycles_training_days_exercises_sets";

-- DropTable
DROP TABLE "mesocycles_training_days";

-- DropEnum
DROP TYPE "WeightUnit";

-- CreateTable
CREATE TABLE "_PrimaryMuscleGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OtherMuscleGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PrimaryMuscleGroups_AB_unique" ON "_PrimaryMuscleGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_PrimaryMuscleGroups_B_index" ON "_PrimaryMuscleGroups"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OtherMuscleGroups_AB_unique" ON "_OtherMuscleGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_OtherMuscleGroups_B_index" ON "_OtherMuscleGroups"("B");

-- AddForeignKey
ALTER TABLE "_PrimaryMuscleGroups" ADD CONSTRAINT "_PrimaryMuscleGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PrimaryMuscleGroups" ADD CONSTRAINT "_PrimaryMuscleGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OtherMuscleGroups" ADD CONSTRAINT "_OtherMuscleGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OtherMuscleGroups" ADD CONSTRAINT "_OtherMuscleGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
