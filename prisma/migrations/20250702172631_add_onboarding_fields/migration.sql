-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingData" JSONB;
