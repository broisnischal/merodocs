-- AlterTable
ALTER TABLE "file" ADD COLUMN     "clientProblemId" TEXT;

-- CreateTable
CREATE TABLE "clientproblem" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" "ProblemStatus" NOT NULL DEFAULT 'pending',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientproblem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_clientProblemId_fkey" FOREIGN KEY ("clientProblemId") REFERENCES "clientproblem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientproblem" ADD CONSTRAINT "clientproblem_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientproblem" ADD CONSTRAINT "clientproblem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
