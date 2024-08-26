import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { RouterModule } from '@nestjs/core';
import { GuestModule } from './modules/guest/guest.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { RideModule } from './modules/ride/ride.module';
import { ServiceModule } from './modules/service/service.module';
import { DetailsModule } from './modules/details/details.module';
import { PeopleModule } from './modules/people/people.module';
import { CheckInOutModule } from './modules/checkinout/checkinout.module';
import { HomeModule } from './modules/home/home.module';
import { ClockInOutModule } from './modules/clockinout/clockinout.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { GroupModule } from './modules/group/group.module';
import { AlertModule } from './modules/alert/alert.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    AuthModule,
    GuestModule,
    DeliveryModule,
    RideModule,
    ServiceModule,
    DetailsModule,
    PeopleModule,
    CheckInOutModule,
    ClockInOutModule,
    HomeModule,
    VehicleModule,
    GroupModule,
    AlertModule,
    NotificationModule,
    RouterModule.register([
      {
        path: 'guard',
        children: [
          AuthModule,
          GuestModule,
          DeliveryModule,
          RideModule,
          ServiceModule,
          DetailsModule,
          PeopleModule,
          CheckInOutModule,
          ClockInOutModule,
          HomeModule,
          VehicleModule,
          GroupModule,
          AlertModule,
          NotificationModule,
        ],
      },
    ]),
  ],
})
export class GuardModule {}
