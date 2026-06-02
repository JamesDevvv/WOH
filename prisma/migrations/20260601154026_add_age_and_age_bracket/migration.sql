-- CreateEnum
CREATE TYPE "AgeBracket" AS ENUM ('C1', 'C2', 'C3');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "ageBracket" "AgeBracket";
