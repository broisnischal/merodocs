-- CreateEnum
CREATE TYPE "FolderTypeEnum" AS ENUM ('document', 'gallery');

-- CreateEnum
CREATE TYPE "FolderAccessEnum" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "FileTypeEnum" AS ENUM ('image', 'media', 'docs', 'others');

-- CreateEnum
CREATE TYPE "AccessRightEnum" AS ENUM ('readonly', 'readwriteanddelete');

-- CreateEnum
CREATE TYPE "UserGenderEnum" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('due', 'paid', 'free_trial');

-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('active', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "PackageTypeEnum" AS ENUM ('free', 'paid');

-- CreateEnum
CREATE TYPE "PaymentTimeEnum" AS ENUM ('annually', 'semiannually', 'quaterly');

-- CreateEnum
CREATE TYPE "PaymentPatternEnum" AS ENUM ('single', 'installment');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired');

-- CreateEnum
CREATE TYPE "SuperAdminNotificationEnum" AS ENUM ('expiring_soon', 'report_issued', 'inactive_account');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('a_positive', 'a_negative', 'b_positive', 'b_negative', 'ab_positive', 'ab_negative', 'o_positive', 'o_negative');

-- CreateEnum
CREATE TYPE "AdminNotificationEnum" AS ENUM ('account_creation_request', 'add_flat_request', 'move_out_request', 'maintenance_ticket', 'recent_poll');

-- CreateEnum
CREATE TYPE "FlatTypeEnum" AS ENUM ('OneRK', 'TwoRK', 'OneBHK', 'TwoBHK', 'ThreeBHK', 'FourBHK', 'None');

-- CreateEnum
CREATE TYPE "EmergencyAlertType" AS ENUM ('Fire', 'Threat', 'Medical', 'Lift_Emergency', 'Robbery', 'Others');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('pending', 'valid_issue', 'working_on_it', 'ticket_closed', 'inappropriate_issue');

-- CreateEnum
CREATE TYPE "ClientUserType" AS ENUM ('owner', 'owner_family', 'tenant', 'tenant_family');

-- CreateEnum
CREATE TYPE "DeviceTypeEnum" AS ENUM ('android', 'ios');

-- CreateEnum
CREATE TYPE "ApartmentClientUserStatusEnum" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "MainUserType" AS ENUM ('admin', 'owner', 'tenant');

-- CreateEnum
CREATE TYPE "ClientUserRequestTypeEnum" AS ENUM ('moveIn', 'moveOut', 'addAccount', 'becomeOwner');

-- CreateEnum
CREATE TYPE "RequestVerifiedTypeEnum" AS ENUM ('owner', 'tenant');

-- CreateEnum
CREATE TYPE "ClientStaffStatus" AS ENUM ('approved', 'pending', 'rejected');

-- CreateEnum
CREATE TYPE "ClientUserTopType" AS ENUM ('owner', 'tenant');

-- CreateEnum
CREATE TYPE "PetTypesEnum" AS ENUM ('dog', 'cat', 'bird', 'others');

-- CreateEnum
CREATE TYPE "VehicleTypeEnum" AS ENUM ('two_wheeler', 'four_wheeler');

-- CreateEnum
CREATE TYPE "CheckTypeEnum" AS ENUM ('preapproved', 'manual');

-- CreateEnum
CREATE TYPE "ServiceProviderTypeEnum" AS ENUM ('delivery', 'ride');

-- CreateEnum
CREATE TYPE "MaintenanceTypeEnum" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('pending', 'open', 'closed');

-- CreateEnum
CREATE TYPE "CommentTypeEnum" AS ENUM ('admin', 'client');

-- CreateEnum
CREATE TYPE "CheckInOutStatusEnum" AS ENUM ('pending', 'approved', 'rejected', 'noresponse');

-- CreateEnum
CREATE TYPE "CheckInOutTypeEnum" AS ENUM ('checkin', 'checkout', 'parcel');

-- CreateEnum
CREATE TYPE "CheckInOutRequestTypeEnum" AS ENUM ('guest', 'delivery', 'service', 'ride', 'adminservice', 'client', 'clientstaff', 'guestmass', 'vehicle', 'group');

-- CreateEnum
CREATE TYPE "CheckInOutCreatedByTypeEnum" AS ENUM ('guard', 'user');

-- CreateEnum
CREATE TYPE "ParcelHistoryEnum" AS ENUM ('collected', 'confirmed');

-- CreateEnum
CREATE TYPE "GuardNotificationEnum" AS ENUM ('guest', 'rider', 'delivery', 'parcel', 'service', 'sos');

-- CreateEnum
CREATE TYPE "ClientNotificationEnum" AS ENUM ('notice', 'polls', 'sos', 'guest', 'delivery', 'parcel', 'ride', 'service', 'clientstaff', 'request');

-- CreateEnum
CREATE TYPE "ClientNotificationLogoEnum" AS ENUM ('none', 'in', 'out', 'approved', 'rejected', 'ride', 'delivery', 'service', 'parcel', 'guest', 'sos');

-- CreateEnum
CREATE TYPE "HomeEnum" AS ENUM ('forResident', 'forGuard', 'forManagement');

-- CreateEnum
CREATE TYPE "NPCEnum" AS ENUM ('notice', 'poll', 'complaint');

-- CreateEnum
CREATE TYPE "SocietyEnum" AS ENUM ('forResident', 'forManagement');

-- CreateEnum
CREATE TYPE "ManagementPlatformTypeEnum" AS ENUM ('resident_management', 'apartment_management', 'visitor_management');

-- CreateEnum
CREATE TYPE "VideoEnum" AS ENUM ('forResident', 'forHome', 'forSecurity');

-- CreateEnum
CREATE TYPE "ContactUsStatusEnum" AS ENUM ('pending', 'responded');

-- CreateEnum
CREATE TYPE "ContactUsRoleEnum" AS ENUM ('PropertyManager', 'Resident', 'PropertyDeveloper', 'FacilitiesManager', 'Other');

-- CreateEnum
CREATE TYPE "FAQTypeEnum" AS ENUM ('home_page', 'for_resident', 'for_guard', 'for_management');

-- CreateEnum
CREATE TYPE "LegalComplianceTypeEnum" AS ENUM ('terms_and_conditions', 'privacy_policy');

-- CreateEnum
CREATE TYPE "BlogStatusEnum" AS ENUM ('published', 'draft', 'scheduled');

-- CreateTable
CREATE TABLE "adminpermission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access" "AccessRightEnum" NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "adminpermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminrole" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "adminrole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminuser" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "UserGenderEnum" NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "token" TEXT[],
    "blockedToken" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "firstLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "bloodgroup" "BloodGroup",
    "hasLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "shiftId" TEXT,

    CONSTRAINT "adminuser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminshift" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start" TIME(4) NOT NULL,
    "end" TIME(4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "adminshift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminnotification" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "AdminNotificationEnum" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adminnotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminservicerole" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "adminservicerole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminserviceshift" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start" TIME(4) NOT NULL,
    "end" TIME(4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "adminserviceshift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminservice" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "UserGenderEnum",
    "contact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "dob" TIMESTAMP(3) NOT NULL,
    "bloodgroup" "BloodGroup" NOT NULL,
    "roleId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "passcode" TEXT NOT NULL,

    CONSTRAINT "adminservice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminserviceattendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "shiftStartTime" TIME(4) NOT NULL,
    "shiftEndTime" TIME(4) NOT NULL,
    "shiftName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adminserviceattendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminserviceclockedevent" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "surveillanceName" TEXT,
    "clockedInTime" TIMESTAMP(3) NOT NULL,
    "clockedOutTime" TIMESTAMP(3),
    "clockedIn" BOOLEAN NOT NULL DEFAULT false,
    "clockedOut" BOOLEAN NOT NULL DEFAULT false,
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adminserviceclockedevent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminactivitylog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "apartmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "blockId" TEXT,

    CONSTRAINT "adminactivitylog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminattendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "shiftStartTime" TIME(4) NOT NULL,
    "shiftEndTime" TIME(4) NOT NULL,
    "shiftName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adminattendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminclockedevent" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "clockedInTime" TIMESTAMP(3) NOT NULL,
    "clockedOutTime" TIMESTAMP(3),
    "clockedIn" BOOLEAN NOT NULL DEFAULT false,
    "clockedOut" BOOLEAN NOT NULL DEFAULT false,
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveillanceName" TEXT NOT NULL,

    CONSTRAINT "adminclockedevent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientuser" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "gender" "UserGenderEnum",
    "dob" TIMESTAMP(3),
    "age" INTEGER,
    "contact" TEXT NOT NULL,
    "email" TEXT,
    "residing" BOOLEAN NOT NULL DEFAULT true,
    "family" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT[],
    "blockedToken" TEXT,
    "moveIn" TIMESTAMP(3),
    "offline" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "bloodgroup" "BloodGroup",
    "acceptedById" TEXT,
    "verifyCode" TEXT,
    "newContact" TEXT,
    "newEmail" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clientuser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartmentclientuser" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "status" "ApartmentClientUserStatusEnum" NOT NULL DEFAULT 'pending',
    "type" "ClientUserType" NOT NULL,
    "requestType" "ClientUserRequestTypeEnum" NOT NULL DEFAULT 'addAccount',
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "flatId" TEXT NOT NULL,
    "residing" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "moveIn" TIMESTAMP(3),
    "moveOut" TIMESTAMP(3),
    "movedOutOrNot" BOOLEAN NOT NULL DEFAULT false,
    "messageByOwner" TEXT,
    "verifiedByOwner" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "requestFor" "MainUserType" NOT NULL DEFAULT 'admin',
    "verifiedByType" "RequestVerifiedTypeEnum",
    "offline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "apartmentclientuser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartmentclientrequestlog" (
    "id" TEXT NOT NULL,
    "status" "ApartmentClientUserStatusEnum" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientUserId" TEXT,
    "apartmentClientUserId" TEXT,
    "message" TEXT,

    CONSTRAINT "apartmentclientrequestlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flatcurrentclient" (
    "id" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "acceptedById" TEXT,
    "type" "ClientUserType" NOT NULL,
    "hasOwner" BOOLEAN NOT NULL DEFAULT false,
    "offline" BOOLEAN NOT NULL DEFAULT false,
    "residing" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flatcurrentclient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalstaffrole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "personalstaffrole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientstaff" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "age" INTEGER,
    "gender" "UserGenderEnum",
    "contact" TEXT NOT NULL,
    "citizenshipNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "bloodgroup" "BloodGroup",
    "emergency_contact" TEXT,
    "status" "ClientStaffStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "approvedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdByType" "ClientUserTopType" NOT NULL,
    "personalStaffRoleId" TEXT,
    "citizenshipBack" TEXT,
    "citizenshipFront" TEXT,

    CONSTRAINT "clientstaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientstaffattendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientstaffattendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientstaffclockedevent" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "surveillanceName" TEXT NOT NULL,
    "clockedIn" BOOLEAN NOT NULL DEFAULT false,
    "clockedOut" BOOLEAN NOT NULL DEFAULT false,
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clockedInTime" TIMESTAMP(3) NOT NULL,
    "clockedOutTime" TIMESTAMP(3),

    CONSTRAINT "clientstaffclockedevent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientstafflog" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "clientStaffId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "clientUserType" "ClientUserTopType" NOT NULL,
    "flatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientstafflog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" TEXT,
    "gender" "UserGenderEnum",
    "description" TEXT,
    "clientUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "flatId" TEXT NOT NULL,
    "typee" "PetTypesEnum" NOT NULL,
    "breed" TEXT,
    "petTypeId" TEXT,

    CONSTRAINT "pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "type" "VehicleTypeEnum" NOT NULL,
    "noplate" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "flatId" TEXT NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isOneDay" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "flatId" TEXT NOT NULL,
    "noOfGuests" INTEGER NOT NULL DEFAULT 0,
    "status" "CheckInOutStatusEnum" NOT NULL DEFAULT 'pending',
    "type" "CheckTypeEnum" NOT NULL DEFAULT 'preapproved',
    "createdByType" "ClientUserType",
    "group" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guestmass" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdById" TEXT,
    "description" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entered" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "createdByType" "ClientUserType",

    CONSTRAINT "guestmass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequentvisitor" (
    "id" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frequentvisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceuser" (
    "id" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "always" BOOLEAN NOT NULL DEFAULT false,
    "flatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contact" TEXT NOT NULL,
    "status" "CheckInOutStatusEnum" NOT NULL DEFAULT 'pending',
    "type" "CheckTypeEnum" NOT NULL DEFAULT 'preapproved',
    "createdById" TEXT,
    "createdByType" "ClientUserType",

    CONSTRAINT "serviceuser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "id" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "leaveAtGate" BOOLEAN NOT NULL DEFAULT false,
    "always" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "status" "CheckInOutStatusEnum" NOT NULL DEFAULT 'pending',
    "type" "CheckTypeEnum" NOT NULL DEFAULT 'preapproved',
    "contact" TEXT,
    "images" TEXT[],
    "name" TEXT,
    "createdByType" "ClientUserType",

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride" (
    "id" TEXT NOT NULL,
    "serviceProviderId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "always" BOOLEAN NOT NULL DEFAULT false,
    "riderName" TEXT,
    "vehicleId" TEXT,
    "flatId" TEXT NOT NULL,
    "status" "CheckInOutStatusEnum" NOT NULL DEFAULT 'pending',
    "type" "CheckTypeEnum" NOT NULL DEFAULT 'preapproved',
    "contact" TEXT,
    "createdByType" "ClientUserType",

    CONSTRAINT "ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentfileclient" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "uploadedForId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apartmentId" TEXT,
    "documentTypeId" TEXT,
    "clientRequestId" TEXT,

    CONSTRAINT "documentfileclient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientnotification" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "ClientNotificationEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logo" "ClientNotificationLogoEnum" NOT NULL DEFAULT 'none',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "path" TEXT NOT NULL DEFAULT '/homeScreenMain',
    "clickable" BOOLEAN NOT NULL DEFAULT true,
    "flatId" TEXT,

    CONSTRAINT "clientnotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientpopupbanner" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "link" TEXT,
    "mobImage" TEXT,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "apartmentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "clientpopupbanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance" (
    "id" TEXT NOT NULL,
    "type" "MaintenanceTypeEnum" NOT NULL,
    "message" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'pending',
    "ticketId" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenancecomment" (
    "id" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "clientUserId" TEXT,
    "message" TEXT,
    "type" "CommentTypeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "maintenancecomment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guarduser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "gender" "UserGenderEnum" NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "contact" TEXT,
    "blockedToken" TEXT,
    "token" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "apartmentId" TEXT NOT NULL,
    "bloodgroup" "BloodGroup" NOT NULL,
    "surveillanceId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "passcode" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "defaultSurveillanceId" TEXT,

    CONSTRAINT "guarduser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardshift" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "start" TIME(4) NOT NULL,
    "end" TIME(4) NOT NULL,

    CONSTRAINT "guardshift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveillance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "surveillance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupentry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "vehicleType" "VehicleTypeEnum",
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isCreated" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "groupentry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkinout" (
    "id" TEXT NOT NULL,
    "type" "CheckInOutTypeEnum" NOT NULL,
    "requestType" "CheckInOutRequestTypeEnum" NOT NULL,
    "createdByType" "CheckInOutCreatedByTypeEnum" NOT NULL,
    "createdByGuardId" TEXT,
    "createdByUserId" TEXT,
    "surveillanceId" TEXT,
    "vehicleNo" TEXT,
    "vehicleType" "VehicleTypeEnum",
    "image" TEXT,
    "guestId" TEXT,
    "deliveryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rideId" TEXT,
    "serviceId" TEXT,
    "apartmentId" TEXT NOT NULL,
    "adminserviceId" TEXT,
    "clientId" TEXT,
    "clientStaffId" TEXT,
    "flatJson" JSONB,
    "flatName" TEXT[],
    "parentJson" JSONB,
    "flatArrayJson" JSONB,
    "guestMassId" TEXT,
    "entered" INTEGER,
    "vehicleId" TEXT,
    "groupEntryId" TEXT,
    "createdByUserType" "ClientUserType",
    "group" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT,

    CONSTRAINT "checkinout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkinoutrequest" (
    "id" TEXT NOT NULL,
    "checkInOutId" TEXT NOT NULL,
    "type" "CheckInOutTypeEnum" NOT NULL,
    "status" "CheckInOutStatusEnum" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedByUserId" TEXT,
    "approvedByGuardId" TEXT,
    "flatId" TEXT NOT NULL,
    "collectedByUserId" TEXT,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "handedByGuardId" TEXT,
    "requestApprovedId" TEXT,
    "hasGuardCheckedIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "checkinoutrequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelhistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ParcelHistoryEnum" NOT NULL,

    CONSTRAINT "parcelhistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardattendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shiftName" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "shiftEndTime" TIME(4) NOT NULL,
    "shiftStartTime" TIME(4) NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "guardattendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardclockedevent" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "surveillanceName" TEXT NOT NULL,
    "clockedIn" BOOLEAN NOT NULL DEFAULT false,
    "clockedOut" BOOLEAN NOT NULL DEFAULT false,
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clockedInTime" TIMESTAMP(3) NOT NULL,
    "clockedOutTime" TIMESTAMP(3),

    CONSTRAINT "guardclockedevent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardnotification" (
    "id" TEXT NOT NULL,
    "guardUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "GuardNotificationEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "clickable" BOOLEAN NOT NULL DEFAULT true,
    "redirectId" TEXT,

    CONSTRAINT "guardnotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FolderTypeEnum" NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "access" "FolderAccessEnum" NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "type" "FileTypeEnum" NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "name" TEXT,
    "folderId" TEXT,
    "adminUserId" TEXT,
    "clientUserId" TEXT,
    "documentClientUserId" TEXT,
    "clientStaffId" TEXT,
    "documentClientStaffId" TEXT,
    "serviceProviderId" TEXT,
    "petId" TEXT,
    "vehicleId" TEXT,
    "adminServiceId" TEXT,
    "guardUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdminId" TEXT,
    "maintenanceId" TEXT,
    "maintenanceCommentId" TEXT,
    "createdById" TEXT,
    "feedbackId" TEXT,
    "serviceTypeId" TEXT,
    "amenityId" TEXT,
    "noticeId" TEXT,
    "documentTypeId" TEXT,
    "problemId" TEXT,
    "documentFileClientId" TEXT,
    "vehicleListId" TEXT,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartmentpopupbanner" (
    "apartmentId" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apartmentpopupbanner_pkey" PRIMARY KEY ("apartmentId","bannerId")
);

-- CreateTable
CREATE TABLE "apartment" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "country" TEXT,
    "province" TEXT,
    "city" TEXT,
    "area" TEXT,
    "postalcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "status" "ApartmentStatus" NOT NULL DEFAULT 'active',
    "subscription" "PayStatus" NOT NULL DEFAULT 'paid',
    "lastUsed" TIMESTAMP(3),
    "colorId" TEXT,
    "mainUser" TEXT NOT NULL,

    CONSTRAINT "apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flat" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FlatTypeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "flat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenity" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "openTime" TEXT,
    "always" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "closeTime" TEXT,

    CONSTRAINT "amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "countVisible" BOOLEAN NOT NULL DEFAULT false,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pollanswer" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pollanswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergencyalert" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL,
    "respondedById" TEXT,
    "type" "EmergencyAlertType" NOT NULL,
    "history" JSONB NOT NULL,
    "surveillance" TEXT,

    CONSTRAINT "emergencyalert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documenttype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "atSignUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "apartmentId" TEXT NOT NULL,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "documenttype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicetype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apartmentId" TEXT,
    "forAll" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicetype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceprovider" (
    "id" TEXT NOT NULL,
    "type" "ServiceProviderTypeEnum" NOT NULL,
    "name" TEXT NOT NULL,
    "apartmentId" TEXT,
    "forAll" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceprovider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gatepass" (
    "id" TEXT NOT NULL,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT NOT NULL,
    "clientStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "flatId" TEXT,
    "backgroundImage" TEXT,
    "clientUserId" TEXT,
    "guestId" TEXT,
    "apartmentId" TEXT,
    "adminServiceId" TEXT,
    "guestMassId" TEXT,

    CONSTRAINT "gatepass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "background_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiclelist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "forAll" BOOLEAN NOT NULL DEFAULT false,
    "apartmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiclelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicleentry" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "isFrequent" BOOLEAN NOT NULL DEFAULT false,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicleentry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userdevices" (
    "id" SERIAL NOT NULL,
    "clientUserId" TEXT,
    "guardUserId" TEXT,
    "deviceId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deviceType" "DeviceTypeEnum" NOT NULL DEFAULT 'android',

    CONSTRAINT "userdevices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadminrole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "superadminrole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadminpermission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access" "AccessRightEnum" NOT NULL,
    "children" TEXT[],
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "superadminpermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadmin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "UserGenderEnum" NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "token" TEXT[],
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "blockedToken" TEXT,

    CONSTRAINT "superadmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "type" "PackageTypeEnum" NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION,
    "time" "PaymentTimeEnum",
    "pattern" "PaymentPatternEnum",
    "apartmentId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "expireReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiredById" TEXT,
    "updatedById" TEXT,
    "paid" DOUBLE PRECISION,
    "remaining" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptionhistory" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "paid" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptionhistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentsetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "documentsetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentfile" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "documentSettingId" TEXT,
    "uploadedForId" TEXT,

    CONSTRAINT "documentfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadminactivitylog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactUsId" TEXT,

    CONSTRAINT "superadminactivitylog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadminnotification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "SuperAdminNotificationEnum" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "superadminnotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminpopupbanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "webImage" TEXT,
    "mobImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "redirectLink" TEXT,

    CONSTRAINT "adminpopupbanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "status" "ProblemStatus" NOT NULL DEFAULT 'pending',
    "updatedById" TEXT,

    CONSTRAINT "problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homesection" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "for" "HomeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homesection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homefeature" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homefeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homecustomerreview" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "society" VARCHAR(100) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homecustomerreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whyussection" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100),
    "type" "HomeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whyussection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whyuscard" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whyuscard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residentfeaturesection" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residentfeaturesection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residentfeature" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residentfeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npcsection" (
    "id" TEXT NOT NULL,
    "type" "NPCEnum" NOT NULL,
    "for" "SocietyEnum" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npcsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npcfeature" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npcfeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videosection" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100),
    "type" "VideoEnum" NOT NULL,
    "video" VARCHAR(200),
    "fileName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videosection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teammember" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "image" VARCHAR(200),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teammember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aboutusstory" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aboutusstory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aboutusservice" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aboutusservice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogcategory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogtag" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "status" "BlogStatusEnum" NOT NULL DEFAULT 'draft',
    "categoryId" TEXT,
    "cover" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managementstatisticsection" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managementstatisticsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managementstatisticfeature" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managementstatisticfeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residentmanagementsection" (
    "id" TEXT NOT NULL,
    "type" "ManagementPlatformTypeEnum" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residentmanagementsection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residentmanagementfeature" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residentmanagementfeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactus" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "number" VARCHAR(15) NOT NULL,
    "societyName" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "role" "ContactUsRoleEnum" NOT NULL,
    "status" "ContactUsStatusEnum" NOT NULL DEFAULT 'pending',
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contactus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" TEXT NOT NULL,
    "for" "FAQTypeEnum" NOT NULL,
    "question" VARCHAR(120) NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legalcompliance" (
    "id" TEXT NOT NULL,
    "type" "LegalComplianceTypeEnum" NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "legalcompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_clientusertoflat" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_pollanswercreatedby" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_apartmentclientusertofile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_clientstafftoflat" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_deliverytoflat" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_checkinouttoflat" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_apartmenttoclientuser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_blogtoblogtag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "adminpermission_roleId_name_key" ON "adminpermission"("roleId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "adminuser_email_key" ON "adminuser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adminserviceattendance_userId_date_key" ON "adminserviceattendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "adminattendance_userId_date_key" ON "adminattendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "clientuser_contact_key" ON "clientuser"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "clientstaffattendance_userId_date_key" ON "clientstaffattendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "frequentvisitor_contact_clientId_key" ON "frequentvisitor"("contact", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "guarduser_username_key" ON "guarduser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "guardattendance_userId_date_key" ON "guardattendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "file_adminUserId_key" ON "file"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "file_clientUserId_key" ON "file"("clientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "file_documentClientUserId_key" ON "file"("documentClientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "file_clientStaffId_key" ON "file"("clientStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "file_documentClientStaffId_key" ON "file"("documentClientStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "file_serviceProviderId_key" ON "file"("serviceProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "file_petId_key" ON "file"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "file_vehicleId_key" ON "file"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "file_adminServiceId_key" ON "file"("adminServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "file_guardUserId_key" ON "file"("guardUserId");

-- CreateIndex
CREATE UNIQUE INDEX "file_superAdminId_key" ON "file"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "file_maintenanceCommentId_key" ON "file"("maintenanceCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "file_serviceTypeId_key" ON "file"("serviceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "file_amenityId_key" ON "file"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "file_vehicleListId_key" ON "file"("vehicleListId");

-- CreateIndex
CREATE UNIQUE INDEX "apartment_name_key" ON "apartment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "apartment_mainUser_key" ON "apartment"("mainUser");

-- CreateIndex
CREATE UNIQUE INDEX "gatepass_code_key" ON "gatepass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "gatepass_clientStaffId_key" ON "gatepass"("clientStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "gatepass_guestId_key" ON "gatepass"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "gatepass_adminServiceId_key" ON "gatepass"("adminServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "gatepass_guestMassId_key" ON "gatepass"("guestMassId");

-- CreateIndex
CREATE UNIQUE INDEX "superadmin_email_key" ON "superadmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "homesection_for_key" ON "homesection"("for");

-- CreateIndex
CREATE UNIQUE INDEX "whyussection_type_key" ON "whyussection"("type");

-- CreateIndex
CREATE UNIQUE INDEX "npcsection_type_for_key" ON "npcsection"("type", "for");

-- CreateIndex
CREATE UNIQUE INDEX "videosection_type_key" ON "videosection"("type");

-- CreateIndex
CREATE UNIQUE INDEX "blogcategory_title_key" ON "blogcategory"("title");

-- CreateIndex
CREATE INDEX "blogcategory_title_idx" ON "blogcategory"("title");

-- CreateIndex
CREATE UNIQUE INDEX "blogtag_title_key" ON "blogtag"("title");

-- CreateIndex
CREATE INDEX "blogtag_title_idx" ON "blogtag"("title");

-- CreateIndex
CREATE UNIQUE INDEX "blog_slug_key" ON "blog"("slug");

-- CreateIndex
CREATE INDEX "blog_title_slug_idx" ON "blog"("title", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "residentmanagementsection_type_key" ON "residentmanagementsection"("type");

-- CreateIndex
CREATE UNIQUE INDEX "legalcompliance_type_key" ON "legalcompliance"("type");

-- CreateIndex
CREATE UNIQUE INDEX "_clientusertoflat_AB_unique" ON "_clientusertoflat"("A", "B");

-- CreateIndex
CREATE INDEX "_clientusertoflat_B_index" ON "_clientusertoflat"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_pollanswercreatedby_AB_unique" ON "_pollanswercreatedby"("A", "B");

-- CreateIndex
CREATE INDEX "_pollanswercreatedby_B_index" ON "_pollanswercreatedby"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_apartmentclientusertofile_AB_unique" ON "_apartmentclientusertofile"("A", "B");

-- CreateIndex
CREATE INDEX "_apartmentclientusertofile_B_index" ON "_apartmentclientusertofile"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_clientstafftoflat_AB_unique" ON "_clientstafftoflat"("A", "B");

-- CreateIndex
CREATE INDEX "_clientstafftoflat_B_index" ON "_clientstafftoflat"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_deliverytoflat_AB_unique" ON "_deliverytoflat"("A", "B");

-- CreateIndex
CREATE INDEX "_deliverytoflat_B_index" ON "_deliverytoflat"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_checkinouttoflat_AB_unique" ON "_checkinouttoflat"("A", "B");

-- CreateIndex
CREATE INDEX "_checkinouttoflat_B_index" ON "_checkinouttoflat"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_apartmenttoclientuser_AB_unique" ON "_apartmenttoclientuser"("A", "B");

-- CreateIndex
CREATE INDEX "_apartmenttoclientuser_B_index" ON "_apartmenttoclientuser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_blogtoblogtag_AB_unique" ON "_blogtoblogtag"("A", "B");

-- CreateIndex
CREATE INDEX "_blogtoblogtag_B_index" ON "_blogtoblogtag"("B");

-- AddForeignKey
ALTER TABLE "adminpermission" ADD CONSTRAINT "adminpermission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminpermission" ADD CONSTRAINT "adminpermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "adminrole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminpermission" ADD CONSTRAINT "adminpermission_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminrole" ADD CONSTRAINT "adminrole_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminrole" ADD CONSTRAINT "adminrole_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminrole" ADD CONSTRAINT "adminrole_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminuser" ADD CONSTRAINT "adminuser_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminuser" ADD CONSTRAINT "adminuser_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminuser" ADD CONSTRAINT "adminuser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "adminrole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminuser" ADD CONSTRAINT "adminuser_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "adminshift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminuser" ADD CONSTRAINT "adminuser_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminshift" ADD CONSTRAINT "adminshift_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminshift" ADD CONSTRAINT "adminshift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminshift" ADD CONSTRAINT "adminshift_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminnotification" ADD CONSTRAINT "adminnotification_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservicerole" ADD CONSTRAINT "adminservicerole_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservicerole" ADD CONSTRAINT "adminservicerole_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservicerole" ADD CONSTRAINT "adminservicerole_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminserviceshift" ADD CONSTRAINT "adminserviceshift_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminserviceshift" ADD CONSTRAINT "adminserviceshift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminserviceshift" ADD CONSTRAINT "adminserviceshift_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservice" ADD CONSTRAINT "adminservice_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservice" ADD CONSTRAINT "adminservice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservice" ADD CONSTRAINT "adminservice_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "adminservicerole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservice" ADD CONSTRAINT "adminservice_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "adminserviceshift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminservice" ADD CONSTRAINT "adminservice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminserviceattendance" ADD CONSTRAINT "adminserviceattendance_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminserviceattendance" ADD CONSTRAINT "adminserviceattendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "adminservice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminserviceclockedevent" ADD CONSTRAINT "adminserviceclockedevent_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "adminserviceattendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminactivitylog" ADD CONSTRAINT "adminactivitylog_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminactivitylog" ADD CONSTRAINT "adminactivitylog_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminactivitylog" ADD CONSTRAINT "adminactivitylog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminattendance" ADD CONSTRAINT "adminattendance_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminattendance" ADD CONSTRAINT "adminattendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "adminuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminclockedevent" ADD CONSTRAINT "adminclockedevent_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "adminattendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientuser" ADD CONSTRAINT "clientuser_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientuser" ADD CONSTRAINT "apartmentclientuser_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientuser" ADD CONSTRAINT "apartmentclientuser_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientuser" ADD CONSTRAINT "apartmentclientuser_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientuser" ADD CONSTRAINT "apartmentclientuser_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientuser" ADD CONSTRAINT "apartmentclientuser_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientrequestlog" ADD CONSTRAINT "apartmentclientrequestlog_apartmentClientUserId_fkey" FOREIGN KEY ("apartmentClientUserId") REFERENCES "apartmentclientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentclientrequestlog" ADD CONSTRAINT "apartmentclientrequestlog_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flatcurrentclient" ADD CONSTRAINT "flatcurrentclient_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flatcurrentclient" ADD CONSTRAINT "flatcurrentclient_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flatcurrentclient" ADD CONSTRAINT "flatcurrentclient_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flatcurrentclient" ADD CONSTRAINT "flatcurrentclient_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaff" ADD CONSTRAINT "clientstaff_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaff" ADD CONSTRAINT "clientstaff_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaff" ADD CONSTRAINT "clientstaff_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaff" ADD CONSTRAINT "clientstaff_personalStaffRoleId_fkey" FOREIGN KEY ("personalStaffRoleId") REFERENCES "personalstaffrole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaffattendance" ADD CONSTRAINT "clientstaffattendance_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaffattendance" ADD CONSTRAINT "clientstaffattendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "clientstaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstaffclockedevent" ADD CONSTRAINT "clientstaffclockedevent_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "clientstaffattendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstafflog" ADD CONSTRAINT "clientstafflog_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstafflog" ADD CONSTRAINT "clientstafflog_clientStaffId_fkey" FOREIGN KEY ("clientStaffId") REFERENCES "clientstaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstafflog" ADD CONSTRAINT "clientstafflog_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientstafflog" ADD CONSTRAINT "clientstafflog_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guestmass" ADD CONSTRAINT "guestmass_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guestmass" ADD CONSTRAINT "guestmass_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequentvisitor" ADD CONSTRAINT "frequentvisitor_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceuser" ADD CONSTRAINT "serviceuser_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceuser" ADD CONSTRAINT "serviceuser_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceuser" ADD CONSTRAINT "serviceuser_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "servicetype"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceprovider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride" ADD CONSTRAINT "ride_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceprovider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentfileclient" ADD CONSTRAINT "documentfileclient_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentfileclient" ADD CONSTRAINT "documentfileclient_clientRequestId_fkey" FOREIGN KEY ("clientRequestId") REFERENCES "apartmentclientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentfileclient" ADD CONSTRAINT "documentfileclient_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "documenttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentfileclient" ADD CONSTRAINT "documentfileclient_uploadedForId_fkey" FOREIGN KEY ("uploadedForId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientnotification" ADD CONSTRAINT "clientnotification_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientnotification" ADD CONSTRAINT "clientnotification_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientpopupbanner" ADD CONSTRAINT "clientpopupbanner_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientpopupbanner" ADD CONSTRAINT "clientpopupbanner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenancecomment" ADD CONSTRAINT "maintenancecomment_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "adminuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenancecomment" ADD CONSTRAINT "maintenancecomment_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenancecomment" ADD CONSTRAINT "maintenancecomment_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarduser" ADD CONSTRAINT "guarduser_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarduser" ADD CONSTRAINT "guarduser_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarduser" ADD CONSTRAINT "guarduser_defaultSurveillanceId_fkey" FOREIGN KEY ("defaultSurveillanceId") REFERENCES "surveillance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarduser" ADD CONSTRAINT "guarduser_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "guardshift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarduser" ADD CONSTRAINT "guarduser_surveillanceId_fkey" FOREIGN KEY ("surveillanceId") REFERENCES "surveillance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarduser" ADD CONSTRAINT "guarduser_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardshift" ADD CONSTRAINT "guardshift_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardshift" ADD CONSTRAINT "guardshift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardshift" ADD CONSTRAINT "guardshift_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillance" ADD CONSTRAINT "surveillance_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillance" ADD CONSTRAINT "surveillance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillance" ADD CONSTRAINT "surveillance_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupentry" ADD CONSTRAINT "groupentry_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_adminserviceId_fkey" FOREIGN KEY ("adminserviceId") REFERENCES "adminservice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_clientStaffId_fkey" FOREIGN KEY ("clientStaffId") REFERENCES "clientstaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_createdByGuardId_fkey" FOREIGN KEY ("createdByGuardId") REFERENCES "guarduser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_groupEntryId_fkey" FOREIGN KEY ("groupEntryId") REFERENCES "groupentry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_guestMassId_fkey" FOREIGN KEY ("guestMassId") REFERENCES "guestmass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "serviceuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_surveillanceId_fkey" FOREIGN KEY ("surveillanceId") REFERENCES "surveillance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinout" ADD CONSTRAINT "checkinout_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicleentry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_approvedByGuardId_fkey" FOREIGN KEY ("approvedByGuardId") REFERENCES "guarduser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_checkInOutId_fkey" FOREIGN KEY ("checkInOutId") REFERENCES "checkinout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_handedByGuardId_fkey" FOREIGN KEY ("handedByGuardId") REFERENCES "guarduser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkinoutrequest" ADD CONSTRAINT "checkinoutrequest_requestApprovedId_fkey" FOREIGN KEY ("requestApprovedId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelhistory" ADD CONSTRAINT "parcelhistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "checkinoutrequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardattendance" ADD CONSTRAINT "guardattendance_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardattendance" ADD CONSTRAINT "guardattendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "guarduser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardclockedevent" ADD CONSTRAINT "guardclockedevent_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "guardattendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardnotification" ADD CONSTRAINT "guardnotification_guardUserId_fkey" FOREIGN KEY ("guardUserId") REFERENCES "guarduser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_adminServiceId_fkey" FOREIGN KEY ("adminServiceId") REFERENCES "adminservice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_documentFileClientId_fkey" FOREIGN KEY ("documentFileClientId") REFERENCES "documentfileclient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "documenttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_guardUserId_fkey" FOREIGN KEY ("guardUserId") REFERENCES "guarduser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_maintenanceCommentId_fkey" FOREIGN KEY ("maintenanceCommentId") REFERENCES "maintenancecomment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "notice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "serviceprovider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "servicetype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_vehicleListId_fkey" FOREIGN KEY ("vehicleListId") REFERENCES "vehiclelist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "client_document_constraint" FOREIGN KEY ("documentClientUserId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "client_image_constraint" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "clientstaff_document_constraint" FOREIGN KEY ("documentClientStaffId") REFERENCES "clientstaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "clientstaff_image_constraint" FOREIGN KEY ("clientStaffId") REFERENCES "clientstaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentpopupbanner" ADD CONSTRAINT "apartmentpopupbanner_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartmentpopupbanner" ADD CONSTRAINT "apartmentpopupbanner_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "adminpopupbanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment" ADD CONSTRAINT "apartment_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment" ADD CONSTRAINT "apartment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment" ADD CONSTRAINT "apartment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block" ADD CONSTRAINT "block_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor" ADD CONSTRAINT "floor_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor" ADD CONSTRAINT "floor_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor" ADD CONSTRAINT "floor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor" ADD CONSTRAINT "floor_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flat" ADD CONSTRAINT "flat_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flat" ADD CONSTRAINT "flat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flat" ADD CONSTRAINT "flat_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flat" ADD CONSTRAINT "flat_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity" ADD CONSTRAINT "amenity_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity" ADD CONSTRAINT "amenity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity" ADD CONSTRAINT "amenity_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll" ADD CONSTRAINT "poll_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll" ADD CONSTRAINT "poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll" ADD CONSTRAINT "poll_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pollanswer" ADD CONSTRAINT "pollanswer_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencyalert" ADD CONSTRAINT "emergencyalert_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencyalert" ADD CONSTRAINT "emergencyalert_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencyalert" ADD CONSTRAINT "emergencyalert_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencyalert" ADD CONSTRAINT "emergencyalert_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "guarduser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documenttype" ADD CONSTRAINT "documenttype_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documenttype" ADD CONSTRAINT "documenttype_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documenttype" ADD CONSTRAINT "documenttype_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicetype" ADD CONSTRAINT "servicetype_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicetype" ADD CONSTRAINT "servicetype_userId_fkey" FOREIGN KEY ("userId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceprovider" ADD CONSTRAINT "serviceprovider_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serviceprovider" ADD CONSTRAINT "serviceprovider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_adminServiceId_fkey" FOREIGN KEY ("adminServiceId") REFERENCES "adminservice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_clientStaffId_fkey" FOREIGN KEY ("clientStaffId") REFERENCES "clientstaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gatepass" ADD CONSTRAINT "gatepass_guestMassId_fkey" FOREIGN KEY ("guestMassId") REFERENCES "guestmass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiclelist" ADD CONSTRAINT "vehiclelist_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicleentry" ADD CONSTRAINT "vehicleentry_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicleentry" ADD CONSTRAINT "vehicleentry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehiclelist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userdevices" ADD CONSTRAINT "userdevices_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userdevices" ADD CONSTRAINT "userdevices_guardUserId_fkey" FOREIGN KEY ("guardUserId") REFERENCES "guarduser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadminrole" ADD CONSTRAINT "superadminrole_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadminrole" ADD CONSTRAINT "superadminrole_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadminpermission" ADD CONSTRAINT "superadminpermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "superadminrole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin" ADD CONSTRAINT "superadmin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin" ADD CONSTRAINT "superadmin_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "superadminrole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadmin" ADD CONSTRAINT "superadmin_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_expiredById_fkey" FOREIGN KEY ("expiredById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptionhistory" ADD CONSTRAINT "subscriptionhistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentsetting" ADD CONSTRAINT "documentsetting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentsetting" ADD CONSTRAINT "documentsetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentfile" ADD CONSTRAINT "documentfile_documentSettingId_fkey" FOREIGN KEY ("documentSettingId") REFERENCES "documentsetting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentfile" ADD CONSTRAINT "documentfile_uploadedForId_fkey" FOREIGN KEY ("uploadedForId") REFERENCES "adminuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "color" ADD CONSTRAINT "color_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "color" ADD CONSTRAINT "color_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadminactivitylog" ADD CONSTRAINT "superadminactivitylog_contactUsId_fkey" FOREIGN KEY ("contactUsId") REFERENCES "contactus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superadminactivitylog" ADD CONSTRAINT "superadminactivitylog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminpopupbanner" ADD CONSTRAINT "adminpopupbanner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adminpopupbanner" ADD CONSTRAINT "adminpopupbanner_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem" ADD CONSTRAINT "problem_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem" ADD CONSTRAINT "problem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "adminuser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem" ADD CONSTRAINT "problem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homefeature" ADD CONSTRAINT "homefeature_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homesection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "whyuscard" ADD CONSTRAINT "whyuscard_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "whyussection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "residentfeature" ADD CONSTRAINT "residentfeature_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "residentfeaturesection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "npcfeature" ADD CONSTRAINT "npcfeature_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "npcsection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blogcategory" ADD CONSTRAINT "blogcategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blogcategory" ADD CONSTRAINT "blogcategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blogtag" ADD CONSTRAINT "blogtag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blogtag" ADD CONSTRAINT "blogtag_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blogcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managementstatisticfeature" ADD CONSTRAINT "managementstatisticfeature_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "managementstatisticsection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "residentmanagementfeature" ADD CONSTRAINT "residentmanagementfeature_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "residentmanagementsection"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legalcompliance" ADD CONSTRAINT "legalcompliance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legalcompliance" ADD CONSTRAINT "legalcompliance_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "superadmin"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_clientusertoflat" ADD CONSTRAINT "_clientusertoflat_A_fkey" FOREIGN KEY ("A") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_clientusertoflat" ADD CONSTRAINT "_clientusertoflat_B_fkey" FOREIGN KEY ("B") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pollanswercreatedby" ADD CONSTRAINT "_pollanswercreatedby_A_fkey" FOREIGN KEY ("A") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pollanswercreatedby" ADD CONSTRAINT "_pollanswercreatedby_B_fkey" FOREIGN KEY ("B") REFERENCES "pollanswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_apartmentclientusertofile" ADD CONSTRAINT "_apartmentclientusertofile_A_fkey" FOREIGN KEY ("A") REFERENCES "apartmentclientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_apartmentclientusertofile" ADD CONSTRAINT "_apartmentclientusertofile_B_fkey" FOREIGN KEY ("B") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_clientstafftoflat" ADD CONSTRAINT "_clientstafftoflat_A_fkey" FOREIGN KEY ("A") REFERENCES "clientstaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_clientstafftoflat" ADD CONSTRAINT "_clientstafftoflat_B_fkey" FOREIGN KEY ("B") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_deliverytoflat" ADD CONSTRAINT "_deliverytoflat_A_fkey" FOREIGN KEY ("A") REFERENCES "delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_deliverytoflat" ADD CONSTRAINT "_deliverytoflat_B_fkey" FOREIGN KEY ("B") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_checkinouttoflat" ADD CONSTRAINT "_checkinouttoflat_A_fkey" FOREIGN KEY ("A") REFERENCES "checkinout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_checkinouttoflat" ADD CONSTRAINT "_checkinouttoflat_B_fkey" FOREIGN KEY ("B") REFERENCES "flat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_apartmenttoclientuser" ADD CONSTRAINT "_apartmenttoclientuser_A_fkey" FOREIGN KEY ("A") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_apartmenttoclientuser" ADD CONSTRAINT "_apartmenttoclientuser_B_fkey" FOREIGN KEY ("B") REFERENCES "clientuser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blogtoblogtag" ADD CONSTRAINT "_blogtoblogtag_A_fkey" FOREIGN KEY ("A") REFERENCES "blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blogtoblogtag" ADD CONSTRAINT "_blogtoblogtag_B_fkey" FOREIGN KEY ("B") REFERENCES "blogtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
