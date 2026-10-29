BEGIN;

ALTER TABLE "Budget" ADD COLUMN "creatorUserId" TEXT,
ADD COLUMN "sharingRevision" INTEGER NOT NULL DEFAULT 0;
-- Preserve creation retry identity when the owner later changes.
UPDATE "Budget" SET "creatorUserId" = "ownerUserId";
ALTER TABLE "Budget" ALTER COLUMN "creatorUserId" SET NOT NULL;
CREATE UNIQUE INDEX "Budget_creatorUserId_requestId_key" ON "Budget"("creatorUserId", "requestId");
DROP INDEX "Budget_ownerUserId_requestId_key";

ALTER TABLE "BudgetCategory" ADD COLUMN "note" VARCHAR(1000) NOT NULL DEFAULT '';
ALTER TABLE "CategoryGroup" ADD COLUMN "note" VARCHAR(1000) NOT NULL DEFAULT '';
ALTER TABLE "MoneyTransaction" ADD COLUMN "payee" VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE "BudgetMember" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BudgetMember" ADD CONSTRAINT "BudgetMember_version_positive" CHECK (version > 0);
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_sharingRevision_nonnegative" CHECK ("sharingRevision" >= 0);

CREATE TABLE "BudgetInvitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "budgetId" TEXT NOT NULL REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "email" VARCHAR(254) NOT NULL,
  "role" "MemberRole" NOT NULL,
  "ownership" BOOLEAN NOT NULL DEFAULT false,
  "tokenHash" CHAR(64) NOT NULL,
  "createdById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "acceptedUserId" TEXT,
  "delivery" "MailStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetInvitation_expiry" CHECK ("expiresAt" > "createdAt"),
  CONSTRAINT "BudgetInvitation_acceptance" CHECK (("acceptedAt" IS NULL) = ("acceptedUserId" IS NULL))
);
CREATE UNIQUE INDEX "BudgetInvitation_tokenHash_key" ON "BudgetInvitation"("tokenHash");
CREATE INDEX "BudgetInvitation_budgetId_createdAt_idx" ON "BudgetInvitation"("budgetId", "createdAt");

COMMIT;
