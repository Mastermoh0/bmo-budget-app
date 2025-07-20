-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- AlterTable
ALTER TABLE "budget_groups" ADD COLUMN     "messageRetentionPolicy" JSONB DEFAULT '{"anonymizedRetentionHours": 24, "allowMemberExport": true, "warnOnUserDeletion": true}';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledDelete" TIMESTAMP(3),
ADD COLUMN     "senderEmail" TEXT,
ADD COLUMN     "senderName" TEXT,
ALTER COLUMN "senderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
