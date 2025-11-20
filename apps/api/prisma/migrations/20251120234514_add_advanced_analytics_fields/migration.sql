-- AlterTable
ALTER TABLE "analytics_events" 
ADD COLUMN "referralUrl" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "deviceType" TEXT,
ADD COLUMN "deviceModel" TEXT,
ADD COLUMN "os" TEXT,
ADD COLUMN "browserVersion" TEXT,
ADD COLUMN "linkUrl" TEXT,
ADD COLUMN "linkLabel" TEXT,
ADD COLUMN "scrollDepth" INTEGER,
ADD COLUMN "sessionId" TEXT,
DROP COLUMN "device" CASCADE;

-- RenameColumn
ALTER TABLE "analytics_events" RENAME COLUMN "referer" TO "referralUrl";

-- CreateIndex
CREATE INDEX "analytics_events_country_idx" ON "analytics_events"("country");
CREATE INDEX "analytics_events_deviceType_idx" ON "analytics_events"("deviceType");
CREATE INDEX "analytics_events_browser_idx" ON "analytics_events"("browser");
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- AlterTable
ALTER TABLE "analytics_card_daily"
ADD COLUMN "avgScrollDepth" DOUBLE PRECISION,
ADD COLUMN "topReferrers" JSONB,
ADD COLUMN "topCountries" JSONB,
ADD COLUMN "deviceBreakdown" JSONB,
ADD COLUMN "browserBreakdown" JSONB,
ADD COLUMN "linkCtr" JSONB;
