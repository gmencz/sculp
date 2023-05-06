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
CREATE TABLE "mesocycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "goal" TEXT,
    "notes" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesocycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycles_training_days" (
    "id" TEXT NOT NULL,
    "mesocycle_id" TEXT,
    "label" TEXT NOT NULL,

    CONSTRAINT "mesocycles_training_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_days_exercises" (
    "id" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "rir" INTEGER NOT NULL,
    "rep_range_lower_bound" INTEGER NOT NULL,
    "rep_range_upper_bound" INTEGER NOT NULL,
    "min_rest_period" INTEGER NOT NULL,
    "max_rest_period" INTEGER NOT NULL,
    "notes" TEXT,
    "exercise_id" TEXT NOT NULL,
    "training_day_id" TEXT,

    CONSTRAINT "training_days_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muscle_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExerciseToMuscleGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MuscleGroupToTrainingDay" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_user_id_key" ON "exercises"("name", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseToMuscleGroup_AB_unique" ON "_ExerciseToMuscleGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseToMuscleGroup_B_index" ON "_ExerciseToMuscleGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MuscleGroupToTrainingDay_AB_unique" ON "_MuscleGroupToTrainingDay"("A", "B");

-- CreateIndex
CREATE INDEX "_MuscleGroupToTrainingDay_B_index" ON "_MuscleGroupToTrainingDay"("B");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days_exercises" ADD CONSTRAINT "training_days_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days_exercises" ADD CONSTRAINT "training_days_exercises_training_day_id_fkey" FOREIGN KEY ("training_day_id") REFERENCES "mesocycles_training_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MuscleGroupToTrainingDay" ADD CONSTRAINT "_MuscleGroupToTrainingDay_A_fkey" FOREIGN KEY ("A") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MuscleGroupToTrainingDay" ADD CONSTRAINT "_MuscleGroupToTrainingDay_B_fkey" FOREIGN KEY ("B") REFERENCES "mesocycles_training_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
