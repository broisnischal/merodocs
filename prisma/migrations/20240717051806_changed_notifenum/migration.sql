/*
  Warnings:

  - The values [report_issued] on the enum `SuperAdminNotificationEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SuperAdminNotificationEnum_new" AS ENUM ('expiring_soon', 'report_issued_client', 'report_issued_apartment', 'inactive_account');
ALTER TABLE "superadminnotification" ALTER COLUMN "type" TYPE "SuperAdminNotificationEnum_new" USING ("type"::text::"SuperAdminNotificationEnum_new");
ALTER TYPE "SuperAdminNotificationEnum" RENAME TO "SuperAdminNotificationEnum_old";
ALTER TYPE "SuperAdminNotificationEnum_new" RENAME TO "SuperAdminNotificationEnum";
DROP TYPE "SuperAdminNotificationEnum_old";
COMMIT;
