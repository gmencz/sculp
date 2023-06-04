-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "stripe_customer_id" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwords" (
    "hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL
);

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
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
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
CREATE TABLE "mesocycles_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "microcycles" INTEGER NOT NULL,
    "rest_days" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesocycles_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "microcycles" INTEGER NOT NULL,
    "rest_days" INTEGER[],
    "goal" TEXT NOT NULL,
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
    "mesocyclePresetId" TEXT,

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
    "weight" DOUBLE PRECISION,
    "rir" INTEGER NOT NULL,
    "rep_range_lower_bound" INTEGER NOT NULL,
    "rep_range_upper_bound" INTEGER NOT NULL,
    "mesocycle_training_day_exercise_id" TEXT,

    CONSTRAINT "mesocycle_training_days_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs" (
    "id" TEXT NOT NULL,
    "mesoycle_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "ran_by_user_id" TEXT,
    "current_user_id" TEXT,

    CONSTRAINT "mesocycles_runs_pkey" PRIMARY KEY ("id")
);

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
    "date" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,

    CONSTRAINT "mesocycles_runs_microcycles_training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs_microcycles_training_days_exercises" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "notes" TEXT,
    "previous_run_id" TEXT,
    "training_day_id" TEXT,
    "exercise_id" TEXT NOT NULL,

    CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" (
    "id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "reps_completed" INTEGER,
    "number" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "rir" INTEGER NOT NULL,
    "rep_range_lower_bound" INTEGER NOT NULL,
    "rep_range_upper_bound" INTEGER NOT NULL,
    "exercise_id" TEXT,

    CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExerciseToMuscleGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "passwords_user_id_key" ON "passwords"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_id_key" ON "subscriptions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_user_id_key" ON "exercises"("name", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "muscle_groups_name_key" ON "muscle_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_presets_name_key" ON "mesocycles_presets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_name_user_id_key" ON "mesocycles"("name", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_current_user_id_key" ON "mesocycles_runs"("current_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mesocycles_runs_microcycles_training_days_exercises_previou_key" ON "mesocycles_runs_microcycles_training_days_exercises"("previous_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseToMuscleGroup_AB_unique" ON "_ExerciseToMuscleGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseToMuscleGroup_B_index" ON "_ExerciseToMuscleGroup"("B");

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocyclePresetId_fkey" FOREIGN KEY ("mesocyclePresetId") REFERENCES "mesocycles_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_mesocycle_training_day_i_fkey" FOREIGN KEY ("mesocycle_training_day_id") REFERENCES "mesocycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" ADD CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycle_training__fkey" FOREIGN KEY ("mesocycle_training_day_exercise_id") REFERENCES "mesocycle_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_mesoycle_id_fkey" FOREIGN KEY ("mesoycle_id") REFERENCES "mesocycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_ran_by_user_id_fkey" FOREIGN KEY ("ran_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_current_user_id_fkey" FOREIGN KEY ("current_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles" ADD CONSTRAINT "mesocycles_runs_microcycles_mesocycle_run_id_fkey" FOREIGN KEY ("mesocycle_run_id") REFERENCES "mesocycles_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_microcycle_id_fkey" FOREIGN KEY ("microcycle_id") REFERENCES "mesocycles_runs_microcycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_previo_fkey" FOREIGN KEY ("previous_run_id") REFERENCES "mesocycles_runs_microcycles_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_traini_fkey" FOREIGN KEY ("training_day_id") REFERENCES "mesocycles_runs_microcycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_exerci_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_e_fkey" FOREIGN KEY ("exercise_id") REFERENCES "mesocycles_runs_microcycles_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
