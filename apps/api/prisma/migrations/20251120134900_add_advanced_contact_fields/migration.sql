-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('FORM', 'QR', 'IMPORTED', 'MANUAL');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "category" TEXT,
ADD COLUMN     "favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "ContactSource" NOT NULL DEFAULT 'FORM';

-- CreateIndex
CREATE INDEX "contacts_favorite_idx" ON "contacts"("favorite");

-- CreateIndex
CREATE INDEX "contacts_category_idx" ON "contacts"("category");
