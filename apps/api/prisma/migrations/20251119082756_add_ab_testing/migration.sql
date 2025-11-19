-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetPath" TEXT NOT NULL,
    "variants" JSONB NOT NULL,
    "conversionGoal" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_assignments" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_events" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiments_status_idx" ON "experiments"("status");

-- CreateIndex
CREATE INDEX "experiments_targetPath_idx" ON "experiments"("targetPath");

-- CreateIndex
CREATE INDEX "experiment_assignments_experimentId_idx" ON "experiment_assignments"("experimentId");

-- CreateIndex
CREATE INDEX "experiment_assignments_sessionId_idx" ON "experiment_assignments"("sessionId");

-- CreateIndex
CREATE INDEX "experiment_events_experimentId_idx" ON "experiment_events"("experimentId");

-- CreateIndex
CREATE INDEX "experiment_events_sessionId_idx" ON "experiment_events"("sessionId");

-- CreateIndex
CREATE INDEX "experiment_events_eventType_idx" ON "experiment_events"("eventType");

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
