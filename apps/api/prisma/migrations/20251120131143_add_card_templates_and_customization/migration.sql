-- CreateTable
CREATE TABLE "card_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "industry" TEXT[],
    "previewImageUrl" TEXT,
    "config" JSONB NOT NULL,
    "minTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_templates_pkey" PRIMARY KEY ("id")
);

-- AlterTable cards - add new customization fields
ALTER TABLE "cards" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "fontFamily" TEXT DEFAULT 'inter',
ADD COLUMN     "fontSize" TEXT DEFAULT 'base',
ADD COLUMN     "layout" TEXT DEFAULT 'vertical',
ADD COLUMN     "backgroundType" TEXT DEFAULT 'solid',
ADD COLUMN     "backgroundColor" TEXT DEFAULT '#ffffff',
ADD COLUMN     "backgroundImage" TEXT,
ADD COLUMN     "borderRadius" TEXT DEFAULT 'md',
ADD COLUMN     "shadowPreset" TEXT DEFAULT 'sm';

-- CreateIndex
CREATE UNIQUE INDEX "card_templates_slug_key" ON "card_templates"("slug");

-- CreateIndex
CREATE INDEX "card_templates_category_idx" ON "card_templates"("category");

-- CreateIndex
CREATE INDEX "card_templates_slug_idx" ON "card_templates"("slug");

-- CreateIndex
CREATE INDEX "card_templates_minTier_idx" ON "card_templates"("minTier");

-- CreateIndex
CREATE INDEX "card_templates_isActive_idx" ON "card_templates"("isActive");

-- CreateIndex
CREATE INDEX "cards_templateId_idx" ON "cards"("templateId");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "card_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
