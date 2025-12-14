-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsEventType" ADD VALUE 'CUSTOMIZATION_SESSION_STARTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CUSTOMIZATION_SESSION_COMPLETED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'COMPONENT_ADDED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'COMPONENT_REMOVED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'COMPONENT_UPDATED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'COMPONENT_REORDERED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CARD_TEMPLATE_APPLIED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CARD_STYLING_UPDATED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'CARD_CUSTOM_CSS_UPDATED';

-- AlterTable
ALTER TABLE "card_templates" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "card_templates_isArchived_idx" ON "card_templates"("isArchived");
