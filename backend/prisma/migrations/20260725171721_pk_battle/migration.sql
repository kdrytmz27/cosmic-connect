-- CreateTable
CREATE TABLE "PkBattle" (
    "id" TEXT NOT NULL,
    "roomAId" TEXT NOT NULL,
    "roomBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "durationSec" INTEGER NOT NULL DEFAULT 300,
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "scoreA" INTEGER NOT NULL DEFAULT 0,
    "scoreB" INTEGER NOT NULL DEFAULT 0,
    "winnerRoomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PkBattle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PkBattle_roomAId_idx" ON "PkBattle"("roomAId");

-- CreateIndex
CREATE INDEX "PkBattle_roomBId_idx" ON "PkBattle"("roomBId");

-- CreateIndex
CREATE INDEX "PkBattle_status_idx" ON "PkBattle"("status");
