import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AmenityModule } from './modules/amenity/amenity.module';
import { ApartmentModule } from './modules/apartment/apartment.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientCommonModule } from './modules/clientcommon/clientcommon.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { DocumentModule } from './modules/document/document.module';
import { GuestModule } from './modules/guest/guest.module';
import { CommentModule } from './modules/maintenance-comment/comment/comment.module';
import { MaintenanceModule } from './modules/maintenance-comment/maintenance/maintenance.module';
import { MemberModule } from './modules/member/member.module';
import { MoveoutModule } from './modules/moveout/moveout.module';
import { NoticeModule } from './modules/notice-polls/notice/notice.module';
import { PollModule } from './modules/notice-polls/poll/poll.module';
import { OtpModule } from './modules/otp/otp.module';
import { PetModule } from './modules/pets/pets.module';
import { ReqModule } from './modules/request/request.module';
import { RideModule } from './modules/ride/ride.module';
import { SocietyModule } from './modules/society/society.module';
import { StaffModule } from './modules/staffs/staff.module';
import { UserModule } from './modules/user/user.module';
import { VehicleModule } from './modules/vehicles/vehicle.module';
import { SUserModule } from './modules/services/services.module';
import { GalleryDocumentModule } from '../client/modules/gallery-document/gallery-document.module';
import { VisitorModule } from './modules/visitors/visitor.module';
import { AlertModule } from './modules/alert/alert.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CheckInApprovalModule } from './modules/checkin-approval/checkin-approval.module';
import { ProblemModule } from './modules/problem/problem.module';
@Module({
  imports: [
    UserModule,
    AuthModule,
    ReqModule,
    StaffModule,
    GuestModule,
    RideModule,
    DeliveryModule,
    NoticeModule,
    VehicleModule,
    PetModule,
    PollModule,
    SocietyModule,
    AmenityModule,
    MaintenanceModule,
    CommentModule,
    MoveoutModule,
    ApartmentModule,
    MemberModule,
    OtpModule,
    DocumentModule,
    ClientCommonModule,
    SUserModule,
    GalleryDocumentModule,
    VisitorModule,
    AlertModule,
    NotificationModule,
    CheckInApprovalModule,
    ProblemModule,
    RouterModule.register([
      {
        path: 'client',
        children: [
          UserModule,
          AuthModule,
          ReqModule,
          StaffModule,
          GuestModule,
          RideModule,
          DeliveryModule,
          NoticeModule,
          VehicleModule,
          PetModule,
          PollModule,
          SocietyModule,
          AmenityModule,
          MaintenanceModule,
          CommentModule,
          MoveoutModule,
          ApartmentModule,
          MemberModule,
          OtpModule,
          DocumentModule,
          ClientCommonModule,
          SUserModule,
          GalleryDocumentModule,
          VisitorModule,
          AlertModule,
          NotificationModule,
          CheckInApprovalModule,
          ProblemModule,
        ],
      },
    ]),
  ],
})
export class ClientModule {}
