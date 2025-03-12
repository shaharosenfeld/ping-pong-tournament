/*
  Warnings:

  - You are about to drop the column `bestOfThree` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `currentGame` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player1Game1Score` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player1Game2Score` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player1Game3Score` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player1Wins` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player2Game1Score` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player2Game2Score` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player2Game3Score` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `player2Wins` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `initials` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `paymentAmount` on the `TournamentRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `TournamentRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `TournamentRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `TournamentRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `TournamentRegistration` table. All the data in the column will be lost.
  - Added the required column `email` to the `TournamentRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `TournamentRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `TournamentRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentRegistration" DROP CONSTRAINT "TournamentRegistration_tournamentId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "bestOfThree",
DROP COLUMN "currentGame",
DROP COLUMN "player1Game1Score",
DROP COLUMN "player1Game2Score",
DROP COLUMN "player1Game3Score",
DROP COLUMN "player1Wins",
DROP COLUMN "player2Game1Score",
DROP COLUMN "player2Game2Score",
DROP COLUMN "player2Game3Score",
DROP COLUMN "player2Wins";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "initials",
ALTER COLUMN "level" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "bitPaymentName" TEXT,
ADD COLUMN     "bitPaymentPhone" TEXT,
ADD COLUMN     "firstPlacePrize" TEXT,
ADD COLUMN     "secondPlacePrize" TEXT;

-- AlterTable
ALTER TABLE "TournamentRegistration" DROP COLUMN "paymentAmount",
DROP COLUMN "paymentDate",
DROP COLUMN "paymentId",
DROP COLUMN "userEmail",
DROP COLUMN "userName",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'bit',
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_player1Id_idx" ON "Match"("player1Id");

-- CreateIndex
CREATE INDEX "Match_player2Id_idx" ON "Match"("player2Id");

-- CreateIndex
CREATE INDEX "TournamentRegistration_tournamentId_idx" ON "TournamentRegistration"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentRegistration_email_phone_idx" ON "TournamentRegistration"("email", "phone");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
