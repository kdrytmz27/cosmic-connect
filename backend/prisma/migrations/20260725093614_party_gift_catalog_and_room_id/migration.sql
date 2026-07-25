-- AlterTable
ALTER TABLE "Gift" ADD COLUMN     "comboCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "roomId" TEXT;

-- CreateTable
CREATE TABLE "PartyGift" (
    "id" TEXT NOT NULL,
    "giftKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "animationUrl" TEXT,
    "animationTier" TEXT NOT NULL DEFAULT 'TOAST',
    "isLuckyEligible" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartyGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartyGift_giftKey_key" ON "PartyGift"("giftKey");

-- CreateIndex
CREATE INDEX "PartyGift_category_idx" ON "PartyGift"("category");

-- CreateIndex
CREATE INDEX "PartyGift_isActive_idx" ON "PartyGift"("isActive");

-- CreateIndex
CREATE INDEX "Gift_roomId_createdAt_idx" ON "Gift"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "Gift_receiverId_createdAt_idx" ON "Gift"("receiverId", "createdAt");
