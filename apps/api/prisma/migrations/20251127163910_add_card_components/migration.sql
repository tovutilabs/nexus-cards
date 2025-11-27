-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_CONTACT', 'ANALYTICS_MILESTONE', 'PAYMENT_SUCCESS', 'NFC_TAG_SCAN', 'CARD_VIEW_MILESTONE', 'SUBSCRIPTION_EXPIRING', 'EXPERIMENT_RESULT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('PROFILE', 'ABOUT', 'CONTACT', 'GALLERY', 'SOCIAL_LINKS', 'CUSTOM_LINKS', 'VIDEO', 'CALENDAR', 'FORM', 'TESTIMONIALS', 'SERVICES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WebhookEventType" ADD VALUE 'LINK_CLICK';
ALTER TYPE "WebhookEventType" ADD VALUE 'SUBSCRIPTION_UPDATED';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newContactEmail" BOOLEAN NOT NULL DEFAULT true,
    "newContactInApp" BOOLEAN NOT NULL DEFAULT true,
    "analyticsMilestoneEmail" BOOLEAN NOT NULL DEFAULT true,
    "analyticsMilestoneInApp" BOOLEAN NOT NULL DEFAULT true,
    "paymentSuccessEmail" BOOLEAN NOT NULL DEFAULT true,
    "paymentSuccessInApp" BOOLEAN NOT NULL DEFAULT true,
    "nfcTagScanEmail" BOOLEAN NOT NULL DEFAULT false,
    "nfcTagScanInApp" BOOLEAN NOT NULL DEFAULT true,
    "cardViewMilestoneEmail" BOOLEAN NOT NULL DEFAULT true,
    "cardViewMilestoneInApp" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionExpiringEmail" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionExpiringInApp" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_data_exports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_data_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cookie_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "necessary" BOOLEAN NOT NULL DEFAULT true,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "preferences" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_components" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "backgroundType" TEXT DEFAULT 'solid',
    "backgroundColor" TEXT DEFAULT '#ffffff',
    "backgroundGradientStart" TEXT,
    "backgroundGradientEnd" TEXT,
    "backgroundImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ComponentType" NOT NULL,
    "defaultConfig" JSONB NOT NULL,
    "previewImageUrl" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_data_exports_userId_idx" ON "user_data_exports"("userId");

-- CreateIndex
CREATE INDEX "user_data_exports_status_idx" ON "user_data_exports"("status");

-- CreateIndex
CREATE INDEX "user_data_exports_expiresAt_idx" ON "user_data_exports"("expiresAt");

-- CreateIndex
CREATE INDEX "cookie_consents_userId_idx" ON "cookie_consents"("userId");

-- CreateIndex
CREATE INDEX "cookie_consents_consentedAt_idx" ON "cookie_consents"("consentedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cookie_consents_sessionId_key" ON "cookie_consents"("sessionId");

-- CreateIndex
CREATE INDEX "card_components_cardId_idx" ON "card_components"("cardId");

-- CreateIndex
CREATE INDEX "card_components_type_idx" ON "card_components"("type");

-- CreateIndex
CREATE INDEX "card_components_cardId_order_idx" ON "card_components"("cardId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "card_components_cardId_order_key" ON "card_components"("cardId", "order");

-- CreateIndex
CREATE INDEX "component_templates_type_idx" ON "component_templates"("type");

-- CreateIndex
CREATE INDEX "component_templates_isPremium_idx" ON "component_templates"("isPremium");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_data_exports" ADD CONSTRAINT "user_data_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookie_consents" ADD CONSTRAINT "cookie_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_components" ADD CONSTRAINT "card_components_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
