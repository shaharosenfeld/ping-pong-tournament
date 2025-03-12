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
    "player1Game1Score" INTEGER,
    "player2Game1Score" INTEGER,
    "player1Game2Score" INTEGER,
    "player2Game2Score" INTEGER,
    "player1Game3Score" INTEGER,
    "player2Game3Score" INTEGER,
    "player1Wins" INTEGER NOT NULL DEFAULT 0,
    "player2Wins" INTEGER NOT NULL DEFAULT 0,
    "currentGame" INTEGER NOT NULL DEFAULT 1,
    "round" INTEGER NOT NULL DEFAULT 1,
    "stage" TEXT,
    "groupName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "date" DATETIME,
    "bestOfThree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("bestOfThree", "createdAt", "date", "groupName", "id", "player1Id", "player1Score", "player2Id", "player2Score", "round", "stage", "status", "tournamentId", "updatedAt") SELECT "bestOfThree", "createdAt", "date", "groupName", "id", "player1Id", "player1Score", "player2Id", "player2Score", "round", "stage", "status", "tournamentId", "updatedAt" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
