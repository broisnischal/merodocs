-- AlterTable
ALTER TABLE "checkinoutrequest" ADD COLUMN     "requestRejectedId" TEXT;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_requestRejectedId_fkey" FOREIGN KEY ("requestRejectedId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
