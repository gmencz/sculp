/*
  Warnings:

  - You are about to drop the column `currentUserId` on the `mesocycles` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `mesocycles` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `mesocycles` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `mesocycles` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `mesocycles_training_days` table. All the data in the column will be lost.
  - You are about to drop the `_MuscleGroupToTrainingDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `training_days_exercises` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,userId]` on the table `mesocycles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `duration_in_week` to the `mesocycles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `mesocycles_training_days` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MuscleGroupToTrainingDay" DROP CONSTRAINT "_MuscleGroupToTrainingDay_A_fkey";

-- DropForeignKey
ALTER TABLE "_MuscleGroupToTrainingDay" DROP CONSTRAINT "_MuscleGroupToTrainingDay_B_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles" DROP CONSTRAINT "mesocycles_currentUserId_fkey";

-- DropForeignKey
ALTER TABLE "training_days_exercises" DROP CONSTRAINT "training_days_exercises_exercise_id_fkey";

-- DropForeignKey
ALTER TABLE "training_days_exercises" DROP CONSTRAINT "training_days_exercises_training_day_id_fkey";

-- DropIndex
DROP INDEX "mesocycles_currentUserId_key";

-- AlterTable
ALTER TABLE "mesocycles" DROP COLUMN "currentUserId",
DROP COLUMN "end_date",
DROP COLUMN "notes",
DROP COLUMN "start_date",
ADD COLUMN     "duration_in_week" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "mesocycles_training_days" DROP COLUMN "order",
ADD COLUMN     "number" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_MuscleGroupToTrainingDay";

-- DropTable
DROP TABLE "training_days_exercises";

-- CreateTable
CREATE TABLE "mesocycle_training_days_exercises" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "exercise_id" TEXT NOT NULL,
    "mesocycleTrainingDayId" TEXT,

    CONSTRAINT "mesocycle_training_days_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycle_training_days_exercises_sets" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rir" INTEGER NOT NULL,
    "rep_range_lower_bound" INTEGER NOT NULL,
    "rep_range_upper_bound" INTEGER NOT NULL,
    "mesocycleTrainingDayExerciseId" TEXT,

    CONSTRAINT "mesocycle_training_days_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_name_userId_key" ON "mesocycles"("name", "userId");

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_mesocycleTrainingDayId_fkey" FOREIGN KEY ("mesocycleTrainingDayId") REFERENCES "mesocycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" ADD CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycleTrainingDa_fkey" FOREIGN KEY ("mesocycleTrainingDayExerciseId") REFERENCES "mesocycle_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
