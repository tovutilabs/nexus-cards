-- RenameColumn (do this first before adding new columns)
ALTER TABLE "analytics_events" RENAME COLUMN "referer" TO "referralUrl";

-- AlterTable
ALTER TABLE "analytics_events" 
ADD COLUMN IF NOT EXISTS "region" TEXT,
ADD COLUMN IF NOT EXISTS "deviceType" TEXT,
ADD COLUMN IF NOT EXISTS "deviceModel" TEXT,
ADD COLUMN IF NOT EXISTS "os" TEXT,
ADD COLUMN IF NOT EXISTS "browserVersion" TEXT,
ADD COLUMN IF NOT EXISTS "linkUrl" TEXT,
ADD COLUMN IF NOT EXISTS "linkLabel" TEXT,
ADD COLUMN IF NOT EXISTS "scrollDepth" INTEGER,
ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

-- Drop device column if exists
ALTER TABLE "analytics_events" DROP COLUMN IF EXISTS "device" CASCADE;

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
