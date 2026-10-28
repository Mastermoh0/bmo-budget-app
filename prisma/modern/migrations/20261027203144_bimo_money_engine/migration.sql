-- CreateEnum
-- Reviewed additive migration: legacy tables and databases are not changed.
CREATE TYPE "MoneyKind" AS ENUM ('OPENING', 'INCOME', 'EXPENSE', 'TRANSFER', 'REFUND');

-- CreateEnum
CREATE TYPE "MoneyAccountKind" AS ENUM ('BANK', 'SAVINGS', 'CASH');

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "moneyRevision" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MoneyAccount" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "kind" "MoneyAccountKind" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyTransaction" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "kind" "MoneyKind" NOT NULL,
    "date" DATE NOT NULL,
    "categoryId" TEXT,
    "memo" VARCHAR(240) NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyEntry" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,

    CONSTRAINT "MoneyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAssignment" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,

    CONSTRAINT "BudgetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyOperation" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "requestId" UUID NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoneyAccount_budgetId_createdAt_idx" ON "MoneyAccount"("budgetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyAccount_budgetId_id_key" ON "MoneyAccount"("budgetId", "id");

-- CreateIndex
CREATE INDEX "BudgetCategory_budgetId_createdAt_idx" ON "BudgetCategory"("budgetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_budgetId_id_key" ON "BudgetCategory"("budgetId", "id");

-- CreateIndex
CREATE INDEX "MoneyTransaction_budgetId_date_id_idx" ON "MoneyTransaction"("budgetId", "date", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyTransaction_budgetId_id_key" ON "MoneyTransaction"("budgetId", "id");

-- CreateIndex
CREATE INDEX "MoneyEntry_budgetId_accountId_transactionId_idx" ON "MoneyEntry"("budgetId", "accountId", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyEntry_transactionId_position_key" ON "MoneyEntry"("transactionId", "position");

-- CreateIndex
CREATE INDEX "BudgetAssignment_budgetId_month_idx" ON "BudgetAssignment"("budgetId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAssignment_budgetId_categoryId_month_key" ON "BudgetAssignment"("budgetId", "categoryId", "month");

-- CreateIndex
CREATE INDEX "MoneyOperation_budgetId_createdAt_id_idx" ON "MoneyOperation"("budgetId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyOperation_budgetId_requestId_key" ON "MoneyOperation"("budgetId", "requestId");

-- AddForeignKey
ALTER TABLE "MoneyAccount" ADD CONSTRAINT "MoneyAccount_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "MoneyTransaction_budgetId_categoryId_fkey" FOREIGN KEY ("budgetId", "categoryId") REFERENCES "BudgetCategory"("budgetId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_budgetId_transactionId_fkey" FOREIGN KEY ("budgetId", "transactionId") REFERENCES "MoneyTransaction"("budgetId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_budgetId_accountId_fkey" FOREIGN KEY ("budgetId", "accountId") REFERENCES "MoneyAccount"("budgetId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAssignment" ADD CONSTRAINT "BudgetAssignment_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAssignment" ADD CONSTRAINT "BudgetAssignment_budgetId_categoryId_fkey" FOREIGN KEY ("budgetId", "categoryId") REFERENCES "BudgetCategory"("budgetId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyOperation" ADD CONSTRAINT "MoneyOperation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MoneyEntry" ADD CONSTRAINT "bimo_entry_position" CHECK (position IN (0,1));
ALTER TABLE "MoneyTransaction" ADD CONSTRAINT "bimo_transaction_category" CHECK (
  (kind IN ('EXPENSE','REFUND') AND "categoryId" IS NOT NULL) OR
  (kind IN ('OPENING','INCOME','TRANSFER') AND "categoryId" IS NULL)
);
ALTER TABLE "BudgetAssignment" ADD CONSTRAINT "bimo_assignment_month" CHECK (EXTRACT(DAY FROM month)=1);

-- Deferred checks see the final posting, including both sides of an edited transfer.
CREATE FUNCTION bimo_check_posting() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  transaction_id text;
  posting_kind "MoneyKind";
  entry_count integer;
  account_count integer;
  total numeric;
  first_amount numeric;
  second_amount numeric;
BEGIN
  IF TG_TABLE_NAME='MoneyTransaction' THEN
    transaction_id := COALESCE(NEW.id, OLD.id);
  ELSE
    transaction_id := COALESCE(NEW."transactionId", OLD."transactionId");
  END IF;
  SELECT kind INTO posting_kind FROM "MoneyTransaction" WHERE id=transaction_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT count(*), count(DISTINCT "accountId"), sum(amount),
    max(amount) FILTER (WHERE position=0), max(amount) FILTER (WHERE position=1)
    INTO entry_count, account_count, total, first_amount, second_amount
    FROM "MoneyEntry" WHERE "transactionId"=transaction_id;
  IF posting_kind='TRANSFER' THEN
    IF entry_count<>2 OR account_count<>2 OR total<>0 OR first_amount>=0 OR second_amount<=0 THEN
      RAISE EXCEPTION 'Invalid Bimo transfer posting' USING ERRCODE='23514';
    END IF;
  ELSE
    IF entry_count<>1 OR first_amount IS NULL OR
      (posting_kind='EXPENSE' AND first_amount>=0) OR
      (posting_kind IN ('INCOME','REFUND') AND first_amount<=0) OR
      (posting_kind='OPENING' AND first_amount<0) THEN
      RAISE EXCEPTION 'Invalid Bimo single-account posting' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER bimo_transaction_posting
AFTER INSERT OR UPDATE ON "MoneyTransaction" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION bimo_check_posting();

CREATE CONSTRAINT TRIGGER bimo_entry_posting
AFTER INSERT OR UPDATE OR DELETE ON "MoneyEntry" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION bimo_check_posting();
