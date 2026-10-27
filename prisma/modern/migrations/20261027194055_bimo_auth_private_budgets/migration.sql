-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
    "ownerUserId" TEXT NOT NULL,
    "requestId" UUID NOT NULL,
    "creationFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetMember" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "lastBudgetId" TEXT,
    "setupCompletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "rateLimit_lastRequest_idx" ON "rateLimit"("lastRequest");

-- CreateIndex
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- CreateIndex
CREATE INDEX "Budget_ownerUserId_idx" ON "Budget"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_ownerUserId_requestId_key" ON "Budget"("ownerUserId", "requestId");

-- CreateIndex
CREATE INDEX "BudgetMember_userId_idx" ON "BudgetMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMember_budgetId_userId_key" ON "BudgetMember"("budgetId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_eventKey_key" ON "EmailOutbox"("eventKey");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_nextAttemptAt_idx" ON "EmailOutbox"("status", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMember" ADD CONSTRAINT "BudgetMember_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMember" ADD CONSTRAINT "BudgetMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
