-- AlterTable
ALTER TABLE "Match" ADD COLUMN "groupName" TEXT;
ALTER TABLE "Match" ADD COLUMN "stage" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "advanceCount" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN "groupCount" INTEGER;
