-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "isMutual" BOOLEAN NOT NULL DEFAULT false,
    "firstInteractionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteractionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCountAtoB" INTEGER NOT NULL DEFAULT 0,
    "viewCountBtoA" INTEGER NOT NULL DEFAULT 0,
    "strengthScore" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connections_userAId_idx" ON "connections"("userAId");

-- CreateIndex
CREATE INDEX "connections_userBId_idx" ON "connections"("userBId");

-- CreateIndex
CREATE INDEX "connections_isMutual_idx" ON "connections"("isMutual");

-- CreateIndex
CREATE INDEX "connections_strengthScore_idx" ON "connections"("strengthScore");

-- CreateIndex
CREATE UNIQUE INDEX "connections_userAId_userBId_key" ON "connections"("userAId", "userBId");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
