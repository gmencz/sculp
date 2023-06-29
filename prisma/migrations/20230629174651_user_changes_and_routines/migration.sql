-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('WARM_UP', 'NORMAL', 'DROP', 'CLUSTER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "track_rir" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines_exercises" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "routine_id" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "routines_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines_exercises_sets" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "SetType" NOT NULL DEFAULT 'NORMAL',
    "weight" DOUBLE PRECISION,
    "reps" INTEGER,
    "rir" INTEGER,
    "routine_exercise_id" TEXT,

    CONSTRAINT "routines_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_key" ON "folders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "routines_name_folder_id_user_id_key" ON "routines"("name", "folder_id", "user_id");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_exercises" ADD CONSTRAINT "routines_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_exercises" ADD CONSTRAINT "routines_exercises_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines_exercises_sets" ADD CONSTRAINT "routines_exercises_sets_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "routines_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
