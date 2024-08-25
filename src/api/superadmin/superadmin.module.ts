import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ApartmentModule } from './modules/apartment/apartment.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { ProblemFeedbackModule } from './modules/problem-feedback/problem-feedback.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProfileModule } from './modules/profile/profile.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PopupBannerModule } from './modules/ad-push/popupbanner/popupbanner.module';
import { WebsiteModule } from './modules/website/website.module';

@Module({
  imports: [
    AuthModule,
    ApartmentModule,
    ClientModule,
    ProblemFeedbackModule,
    SettingsModule,
    SubscriptionModule,
    DashboardModule,
    ProfileModule,
    NotificationModule,
    PopupBannerModule,
    WebsiteModule,
    RouterModule.register([
      {
        path: 'superadmin',
        children: [
          AuthModule,
          ApartmentModule,
          ClientModule,
          SubscriptionModule,
          DashboardModule,
          ProfileModule,
          NotificationModule,
          PopupBannerModule,
        ],
      },
    ]),
  ],
})
export class SuperadminModule {}
