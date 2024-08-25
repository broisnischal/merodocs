import { Module } from '@nestjs/common';
import { AdminUserModule } from './modules/society_staffs/adminuser/adminuser.module';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/society_staffs/role/role.module';
import { PermissionModule } from './modules/society_staffs/permission/permission.module';
import { SurveillanceModule } from './modules/apartment_detail/surveillance/surveillance.module';
import { ProfileModule } from './modules/society_staffs/profile/profile.module';
import { ApartmentModule } from './modules/apartment_detail/apartment/apartment.module';
import { BlockModule } from './modules/apartment_detail/block/block.module';
import { FloorModule } from './modules/apartment_detail/floor/floor.module';
import { GuardUserModule } from './modules/society_staffs/guarduser/guarduser.module';
import { ServiceUserModule } from './modules/society_staffs/serviceuser/serviceuser.module';
import { FlatModule } from './modules/apartment_detail/flat/flat.module';
import { GalleryDocumentModule } from './modules/gallery-document/gallery-document.module';
import { NoticeModule } from './modules/notice-polls/notice/notice.module';
import { PollModule } from './modules/notice-polls/poll/poll.module';
import { AmenityModule } from './modules/amenity/amenity.module';
import { ApartmentClientUserModule } from './modules/approval_requests/apartmentclientuser/apartmentclientuser.module';
import { MaintenanceModule } from './modules/maintenance-comment/maintenance/maintenance.module';
import { CommentModule } from './modules/maintenance-comment/comment/comment.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ResidentialStaffModule } from './modules/residential_staff/residential_staff.module';
import { ResidentModule } from './modules/resident/resident.module';
import { DocumentTypeModule } from './modules/document-type/document-type.module';
import { ProblemModule } from './modules/problem-feedback/problem/problem.module';
import { FeedbackModule } from './modules/problem-feedback/feedback/feedback.module';
import { AdminNotificationModule } from './modules/notification/notification.module';
import { ColorModule } from './modules/color/color.module';
import { GuardShiftModule } from './modules/society_staffs/guardshift/guardshift.module';
import { ServiceRoleModule } from './modules/society_staffs/servicerole/servicerole.module';
import { ServiceShiftModule } from './modules/society_staffs/serviceshift/serviceshift.module';
import { CheckInOutModule } from './modules/checkinout/checkinout.module';
import { PopUpModule } from './modules/popup/popup.module';
import { AlertModule } from './modules/alert/alert.module';
import { AdminShiftModule } from './modules/society_staffs/adminshift/adminshift.module';

// test
@Module({
  imports: [
    AdminUserModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    SurveillanceModule,
    ProfileModule,
    ApartmentModule,
    BlockModule,
    FloorModule,
    GuardUserModule,
    ServiceUserModule,
    FlatModule,
    GalleryDocumentModule,
    NoticeModule,
    PollModule,
    AmenityModule,
    ApartmentClientUserModule,
    MaintenanceModule,
    CommentModule,
    DashboardModule,
    ResidentialStaffModule,
    ResidentModule,
    DocumentTypeModule,
    ProblemModule,
    FeedbackModule,
    AdminNotificationModule,
    ColorModule,
    GuardShiftModule,
    ServiceRoleModule,
    ServiceShiftModule,
    CheckInOutModule,
    PopUpModule,
    AlertModule,
    AdminShiftModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [
          AdminUserModule,
          AuthModule,
          RoleModule,
          PermissionModule,
          SurveillanceModule,
          ProfileModule,
          ApartmentModule,
          BlockModule,
          FloorModule,
          GuardUserModule,
          ServiceUserModule,
          FlatModule,
          GalleryDocumentModule,
          NoticeModule,
          PollModule,
          AmenityModule,
          ApartmentClientUserModule,
          MaintenanceModule,
          CommentModule,
          DashboardModule,
          ResidentialStaffModule,
          ResidentModule,
          DocumentTypeModule,
          ProblemModule,
          FeedbackModule,
          AdminNotificationModule,
          ColorModule,
          GuardShiftModule,
          ServiceRoleModule,
          ServiceShiftModule,
          CheckInOutModule,
          PopUpModule,
          AlertModule,
          AdminShiftModule,
        ],
      },
    ]),
  ],
})
export class AdminModule {}
