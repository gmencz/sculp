-- DropForeignKey
ALTER TABLE "exercises" DROP CONSTRAINT "exercises_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycle_training_days_exercises" DROP CONSTRAINT "mesocycle_training_days_exercises_mesocycle_training_day_i_fkey";

-- DropForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" DROP CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycle_training__fkey";

-- DropForeignKey
ALTER TABLE "mesocycles" DROP CONSTRAINT "mesocycles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_mesoycle_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs" DROP CONSTRAINT "mesocycles_runs_ran_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles" DROP CONSTRAINT "mesocycles_runs_microcycles_mesocycle_run_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_microcycle_id_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_traini_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" DROP CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_e_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_training_days" DROP CONSTRAINT "mesocycles_training_days_mesocyclePresetId_fkey";

-- DropForeignKey
ALTER TABLE "mesocycles_training_days" DROP CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_training_days" ADD CONSTRAINT "mesocycles_training_days_mesocyclePresetId_fkey" FOREIGN KEY ("mesocyclePresetId") REFERENCES "mesocycles_presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises" ADD CONSTRAINT "mesocycle_training_days_exercises_mesocycle_training_day_i_fkey" FOREIGN KEY ("mesocycle_training_day_id") REFERENCES "mesocycles_training_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_training_days_exercises_sets" ADD CONSTRAINT "mesocycle_training_days_exercises_sets_mesocycle_training__fkey" FOREIGN KEY ("mesocycle_training_day_exercise_id") REFERENCES "mesocycle_training_days_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_mesoycle_id_fkey" FOREIGN KEY ("mesoycle_id") REFERENCES "mesocycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs" ADD CONSTRAINT "mesocycles_runs_ran_by_user_id_fkey" FOREIGN KEY ("ran_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles" ADD CONSTRAINT "mesocycles_runs_microcycles_mesocycle_run_id_fkey" FOREIGN KEY ("mesocycle_run_id") REFERENCES "mesocycles_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_microcycle_id_fkey" FOREIGN KEY ("microcycle_id") REFERENCES "mesocycles_runs_microcycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_traini_fkey" FOREIGN KEY ("training_day_id") REFERENCES "mesocycles_runs_microcycles_training_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles_runs_microcycles_training_days_exercises_sets" ADD CONSTRAINT "mesocycles_runs_microcycles_training_days_exercises_sets_e_fkey" FOREIGN KEY ("exercise_id") REFERENCES "mesocycles_runs_microcycles_training_days_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
