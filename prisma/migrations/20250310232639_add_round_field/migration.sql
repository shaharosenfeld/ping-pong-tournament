/*
  Warnings:

  - You are about to drop the `League` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeagueMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LeagueToPlayer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_LeagueToPlayer_B_index";

-- DropIndex
DROP INDEX "_LeagueToPlayer_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "League";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LeagueMatch";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_LeagueToPlayer";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    "round" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "date" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "date", "id", "player1Id", "player1Score", "player2Id", "player2Score", "status", "tournamentId", "updatedAt") SELECT "createdAt", "date", "id", "player1Id", "player1Score", "player2Id", "player2Score", "status", "tournamentId", "updatedAt" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN "avatar" TEXT;
ALTER TABLE "Player" ADD COLUMN "initials" TEXT;
ALTER TABLE "Player" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Player" ADD COLUMN "bio" TEXT;
ALTER TABLE "Player" ADD COLUMN "wins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Player" ADD COLUMN "losses" INTEGER NOT NULL DEFAULT 0;
