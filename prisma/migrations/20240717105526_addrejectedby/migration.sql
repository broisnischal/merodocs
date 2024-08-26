-- AlterTable
ALTER TABLE "checkinoutrequest" ADD COLUMN     "rejectedByGuardId" TEXT;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_rejectedByGuardId_fkey" FOREIGN KEY ("rejectedByGuardId") REFERENCES "guarduser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
