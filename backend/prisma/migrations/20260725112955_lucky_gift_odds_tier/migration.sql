-- AlterTable
ALTER TABLE "Gift" ADD COLUMN     "isLucky" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "luckyMultiplier" DOUBLE PRECISION,
ADD COLUMN     "luckyWonAmount" INTEGER;

-- CreateTable
CREATE TABLE "LuckyGiftOddsTier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weightPct" DOUBLE PRECISION NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LuckyGiftOddsTier_pkey" PRIMARY KEY ("id")
);
