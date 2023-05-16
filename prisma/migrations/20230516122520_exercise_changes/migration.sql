-- CreateEnum
CREATE TYPE "JointPain" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH');

-- DropForeignKey
ALTER TABLE "exercises" DROP CONSTRAINT "exercises_user_id_fkey";

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "joint_pain" "JointPain" NOT NULL DEFAULT 'NONE',
ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
