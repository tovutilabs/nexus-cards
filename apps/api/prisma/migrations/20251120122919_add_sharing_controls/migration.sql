-- CreateEnum
CREATE TYPE "CardPrivacyMode" AS ENUM ('PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED');

-- CreateEnum
CREATE TYPE "ShareChannel" AS ENUM ('DIRECT', 'WHATSAPP', 'TELEGRAM', 'SMS', 'EMAIL', 'LINKEDIN');

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "allowContactSubmission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultPassword" TEXT,
ADD COLUMN     "privacyMode" "CardPrivacyMode" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,
    "privacyMode" "CardPrivacyMode" NOT NULL DEFAULT 'PUBLIC',
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "allowContactSubmission" BOOLEAN NOT NULL DEFAULT true,
    "channel" "ShareChannel" NOT NULL DEFAULT 'DIRECT',
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_cardId_idx" ON "share_links"("cardId");

-- CreateIndex
CREATE INDEX "share_links_token_idx" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_expiresAt_idx" ON "share_links"("expiresAt");

-- CreateIndex
CREATE INDEX "share_links_revokedAt_idx" ON "share_links"("revokedAt");

-- CreateIndex
CREATE INDEX "cards_privacyMode_idx" ON "cards"("privacyMode");

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
