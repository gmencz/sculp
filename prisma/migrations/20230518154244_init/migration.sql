-- CreateEnum
CREATE TYPE "JointPain" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwords" (
    "hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "current_logbook" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joint_pain" "JointPain" DEFAULT 'NONE',
    "user_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muscle_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "microcycles" INTEGER NOT NULL,
    "rest_days" INTEGER[],
    "goal" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "mesocycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_training_days" (
    "id" TEXT NOT NULL,
    "mesocycle_id" TEXT,
    "label" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "mesocycles_training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycle_training_days_exercises" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "notes" TEXT,
    "exercise_id" TEXT NOT NULL,
    "mesocycle_training_day_id" TEXT,

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
    "mesocycle_training_day_exercise_id" TEXT,

    CONSTRAINT "mesocycle_training_days_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs" (
    "id" TEXT NOT NULL,
    "mesoycle_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "ran_by_user_id" TEXT,
    "currentUserId" TEXT,

    CONSTRAINT "mesocycles_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExerciseToMuscleGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "passwords_user_id_key" ON "passwords"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_requests_email_key" ON "access_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_user_id_key" ON "exercises"("name", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "muscle_groups_name_key" ON "muscle_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_name_user_id_key" ON "mesocycles"("name", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_mesoycle_id_key" ON "mesocycles_runs"("mesoycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_currentUserId_key" ON "mesocycles_runs"("currentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseToMuscleGroup_AB_unique" ON "_ExerciseToMuscleGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseToMuscleGroup_B_index" ON "_ExerciseToMuscleGroup"("B");

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_mesocycle_training_day_i_fkey" FOREIGN KEY ("mesocycle_training_day_id") REFERENCES "mesocycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" ADD CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycle_training__fkey" FOREIGN KEY ("mesocycle_training_day_exercise_id") REFERENCES "mesocycle_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_mesoycle_id_fkey" FOREIGN KEY ("mesoycle_id") REFERENCES "mesocycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_ran_by_user_id_fkey" FOREIGN KEY ("ran_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
