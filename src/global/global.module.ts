import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminActivityService } from './activity/admin-activity.service';
import { SuperAdminActivityService } from './activity/superadmin-activity.service';
import { AWSStorageService } from './aws/aws.service';
import { EnvService } from './env/env.service';
import { FileService } from './file/file.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaTransactionService } from './prisma/prisma-transaction.service';
import { OTPService } from './otp/otp.service';
import { MailService } from './mail/mail.service';
import { AdminNotificationService } from './notification/admin-notification.service';
import { SuperAdminNotificationService } from './notification/superadmin-notification.service';
import { AttendanceService } from './attendance/attendance.service';
import { CheckInOutLogService } from './checkinout/checkinout.service';
import { ClientFirebaseService } from './firebase/client-firebase.service';
import { GuardFirebaseService } from './firebase/guard-firebase.service';
import { GuardNotificationService } from './notification/guard-notification.service';
import { ClientNotificationService } from './notification/client-notification.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    EnvService,
    PrismaService,
    Logger,
    AWSStorageService,
    FileService,
    AdminActivityService,
    PrismaTransactionService,
    OTPService,
    MailService,
    AdminNotificationService,
    SuperAdminActivityService,
    SuperAdminNotificationService,
    AttendanceService,
    CheckInOutLogService,
    ClientFirebaseService,
    GuardFirebaseService,
    GuardNotificationService,
    ClientNotificationService,
  ],
  exports: [
    EnvService,
    PrismaService,
    Logger,
    AWSStorageService,
    FileService,
    AdminActivityService,
    PrismaTransactionService,
    OTPService,
    MailService,
    AdminNotificationService,
    SuperAdminActivityService,
    SuperAdminNotificationService,
    AttendanceService,
    CheckInOutLogService,
    ClientFirebaseService,
    GuardFirebaseService,
    GuardNotificationService,
    ClientNotificationService,
  ],
})
export class GlobalModule {}
