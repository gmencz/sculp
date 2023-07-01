/*
  Warnings:

  - Added the required column `track_rir` to the `routines` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PreviousValuesFrom" AS ENUM ('ANY', 'SAME_ROUTINE');

-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "routines_exercises" DROP CONSTRAINT "routines_exercises_routine_id_fkey";

-- DropForeignKey
ALTER TABLE "routines_exercises_sets" DROP CONSTRAINT "routines_exercises_sets_routine_exercise_id_fkey";

-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "previous_values_from" "PreviousValuesFrom" NOT NULL DEFAULT 'ANY',
ADD COLUMN     "track_rir" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "routines_exercises" ADD COLUMN     "normal_sets_rest_timer_in_seconds" INTEGER,
ADD COLUMN     "superset_id" TEXT,
ADD COLUMN     "warm_up_sets_rest_timer_in_seconds" INTEGER;

-- CreateTable
CREATE TABLE "routines_supersets" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,

    CONSTRAINT "routines_supersets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,
    "routine_id" TEXT,
    "track_rir" BOOLEAN NOT NULL,
    "previous_values_from" "PreviousValuesFrom" NOT NULL DEFAULT 'ANY',

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions_exercises" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    "warm_up_sets_rest_timer_in_seconds" INTEGER,
    "normal_sets_rest_timer_in_seconds" INTEGER,
    "superset_id" TEXT,

    CONSTRAINT "training_sessions_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_session_supersets" (
    "id" TEXT NOT NULL,
    "training_session_id" TEXT NOT NULL,

    CONSTRAINT "training_session_supersets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions_exercises_sets" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "SetType" NOT NULL DEFAULT 'NORMAL',
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "rir" INTEGER,
    "trainingSessionExerciseId" TEXT,

    CONSTRAINT "training_sessions_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_exercises" ADD CONSTRAINT "routines_exercises_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_exercises" ADD CONSTRAINT "routines_exercises_superset_id_fkey" FOREIGN KEY ("superset_id") REFERENCES "routines_supersets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_supersets" ADD CONSTRAINT "routines_supersets_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_exercises_sets" ADD CONSTRAINT "routines_exercises_sets_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "routines_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions_exercises" ADD CONSTRAINT "training_sessions_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions_exercises" ADD CONSTRAINT "training_sessions_exercises_superset_id_fkey" FOREIGN KEY ("superset_id") REFERENCES "training_session_supersets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_session_supersets" ADD CONSTRAINT "training_session_supersets_training_session_id_fkey" FOREIGN KEY ("training_session_id") REFERENCES "training_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions_exercises_sets" ADD CONSTRAINT "training_sessions_exercises_sets_trainingSessionExerciseId_fkey" FOREIGN KEY ("trainingSessionExerciseId") REFERENCES "training_sessions_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
