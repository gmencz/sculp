-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LBS');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT,
ADD COLUMN     "theme_preference" "Theme" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "weight_unit_preference" "WeightUnit" NOT NULL DEFAULT 'KG';
