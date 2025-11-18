-- AlterTable
ALTER TABLE "nfc_tags" ADD COLUMN     "assignedUserId" TEXT;

-- CreateIndex
CREATE INDEX "nfc_tags_assignedUserId_idx" ON "nfc_tags"("assignedUserId");

-- AddForeignKey
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
