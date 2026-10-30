BEGIN;
ALTER TABLE "Budget" ADD COLUMN "isPractice" BOOLEAN NOT NULL DEFAULT false;
CREATE TYPE "TutorialStatus" AS ENUM ('ACTIVE', 'SKIPPED', 'COMPLETED');
CREATE TABLE "TutorialProgress" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "status" "TutorialStatus" NOT NULL DEFAULT 'ACTIVE',
  "practiceBudgetId" TEXT,
  "practiceDate" DATE,
  "lesson" INTEGER NOT NULL DEFAULT 1 CHECK ("lesson" BETWEEN 1 AND 7),
  "challenge" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 0,
  "lastRequestId" UUID,
  "lastAction" TEXT,
  "lastDestination" TEXT,
  "startedAt" TIMESTAMP(3),
  "firstActionAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TutorialProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TutorialProgress_practiceBudgetId_fkey" FOREIGN KEY ("practiceBudgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TutorialProgress_practiceBudgetId_key" ON "TutorialProgress"("practiceBudgetId");
COMMIT;
