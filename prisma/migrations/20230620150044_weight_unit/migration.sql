-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KILOGRAM', 'POUND');

-- AlterTable
ALTER TABLE "mesocycles" ADD COLUMN     "weight_unit_preference" "WeightUnit" NOT NULL DEFAULT 'KILOGRAM';

-- AlterTable
ALTER TABLE "mesocycles_runs" ADD COLUMN     "progressive_rir" BOOLEAN NOT NULL DEFAULT false;
