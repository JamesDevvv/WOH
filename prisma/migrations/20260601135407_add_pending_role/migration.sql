-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "updatedAt" DROP DEFAULT;
