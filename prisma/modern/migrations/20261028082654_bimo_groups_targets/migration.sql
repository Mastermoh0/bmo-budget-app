-- CreateEnum
CREATE TYPE "TargetKind" AS ENUM ('MONTHLY', 'BY_DATE');

-- AlterTable
ALTER TABLE "BudgetCategory" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CategoryGroup" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTarget" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "kind" "TargetKind" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "startMonth" DATE NOT NULL,
    "dueDate" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryGroup_budgetId_sortOrder_idx" ON "CategoryGroup"("budgetId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryGroup_budgetId_id_key" ON "CategoryGroup"("budgetId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTarget_budgetId_categoryId_key" ON "CategoryTarget"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "BudgetCategory_budgetId_groupId_sortOrder_idx" ON "BudgetCategory"("budgetId", "groupId", "sortOrder");

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_groupId_fkey" FOREIGN KEY ("budgetId", "groupId") REFERENCES "CategoryGroup"("budgetId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryGroup" ADD CONSTRAINT "CategoryGroup_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTarget" ADD CONSTRAINT "CategoryTarget_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTarget" ADD CONSTRAINT "CategoryTarget_budgetId_categoryId_fkey" FOREIGN KEY ("budgetId", "categoryId") REFERENCES "BudgetCategory"("budgetId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CategoryGroup" ADD CONSTRAINT "bimo_group_order" CHECK ("sortOrder">=0 AND version>0);
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "bimo_category_order" CHECK ("sortOrder">=0);
ALTER TABLE "CategoryTarget" ADD CONSTRAINT "bimo_target_amount" CHECK (amount>0 AND version>0);
ALTER TABLE "CategoryTarget" ADD CONSTRAINT "bimo_target_start" CHECK (EXTRACT(DAY FROM "startMonth")=1);
ALTER TABLE "CategoryTarget" ADD CONSTRAINT "bimo_target_deadline" CHECK (
  (kind='MONTHLY' AND "dueDate" IS NULL) OR
  (kind='BY_DATE' AND "dueDate" IS NOT NULL AND "dueDate">="startMonth")
);
