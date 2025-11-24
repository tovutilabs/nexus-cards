-- AlterTable
ALTER TABLE "cards" ADD COLUMN "fieldVisibility" JSONB;

-- AlterTable
ALTER TABLE "share_links" ADD COLUMN "maxUses" INTEGER,
ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "connections" ADD COLUMN "notes" TEXT,
ADD COLUMN "tags" TEXT[];

-- CreateTable
CREATE TABLE "card_access_list" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_access_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_access_list_cardId_idx" ON "card_access_list"("cardId");

-- CreateIndex
CREATE INDEX "card_access_list_userId_idx" ON "card_access_list"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "card_access_list_cardId_userId_key" ON "card_access_list"("cardId", "userId");

-- AddForeignKey
ALTER TABLE "card_access_list" ADD CONSTRAINT "card_access_list_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_access_list" ADD CONSTRAINT "card_access_list_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_access_list" ADD CONSTRAINT "card_access_list_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
