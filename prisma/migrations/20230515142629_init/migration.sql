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
    "user_id" TEXT NOT NULL,
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
    "duration_in_week" INTEGER NOT NULL,
    "goal" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

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
CREATE UNIQUE INDEX "mesocycles_name_userId_key" ON "mesocycles"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseToMuscleGroup_AB_unique" ON "_ExerciseToMuscleGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseToMuscleGroup_B_index" ON "_ExerciseToMuscleGroup"("B");

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_mesocycleTrainingDayId_fkey" FOREIGN KEY ("mesocycleTrainingDayId") REFERENCES "mesocycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" ADD CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycleTrainingDa_fkey" FOREIGN KEY ("mesocycleTrainingDayExerciseId") REFERENCES "mesocycle_training_days_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
