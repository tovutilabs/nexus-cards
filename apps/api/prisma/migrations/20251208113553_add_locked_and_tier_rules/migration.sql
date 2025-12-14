-- AlterTable
ALTER TABLE "card_components" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tier_component_rules" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "componentType" "ComponentType" NOT NULL,
    "maxAllowed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_component_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tier_component_rules_tier_idx" ON "tier_component_rules"("tier");

-- CreateIndex
CREATE INDEX "tier_component_rules_componentType_idx" ON "tier_component_rules"("componentType");

-- CreateIndex
CREATE UNIQUE INDEX "tier_component_rules_tier_componentType_key" ON "tier_component_rules"("tier", "componentType");

-- CreateIndex
CREATE INDEX "card_components_locked_idx" ON "card_components"("locked");
