-- DropForeignKey
ALTER TABLE "mesocycle_training_days_exercises" DROP CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_exerci_fkey";

-- AlterTable
ALTER TABLE "mesocycle_training_days_exercises" ALTER COLUMN "exercise_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ALTER COLUMN "exercise_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_exerci_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
