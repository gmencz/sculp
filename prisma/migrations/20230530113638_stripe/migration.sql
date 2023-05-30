/*
  Warnings:

  - You are about to drop the column `joint_pain` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the column `target_reps_to_complete` on the `mesocycles_runs_microcycles_training_days_exercises_sets` table. All the data in the column will be lost.
  - You are about to drop the `access_requests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[previous_run_id]` on the table `mesocycles_runs_microcycles_training_days_exercises` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `mesocycles_runs_microcycles_training_days` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "joint_pain";

-- AlterTable
ALTER TABLE "mesocycle_training_days_exercises_sets" ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mesocycles_runs_microcycles_training_days" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD COLUMN     "previous_run_id" TEXT;

-- AlterTable
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" DROP COLUMN "target_reps_to_complete",
ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mesocycles_training_days" ADD COLUMN     "mesocyclePresetId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_customer_id" TEXT;

-- DropTable
DROP TABLE "access_requests";

-- DropEnum
DROP TYPE "JointPain";

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_start" INTEGER NOT NULL,
    "current_period_end" INTEGER NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "microcycles" INTEGER NOT NULL,
    "rest_days" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesocycles_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_id_key" ON "subscriptions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_presets_name_key" ON "mesocycles_presets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_microcycles_training_days_exercises_previou_key" ON "mesocycles_runs_microcycles_training_days_exercises"("previous_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocyclePresetId_fkey" FOREIGN KEY ("mesocyclePresetId") REFERENCES "mesocycles_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_previo_fkey" FOREIGN KEY ("previous_run_id") REFERENCES "mesocycles_runs_microcycles_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
