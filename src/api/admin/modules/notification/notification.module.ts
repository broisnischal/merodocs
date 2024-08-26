import { Module } from '@nestjs/common';
import { AdminNotificationController } from './notification.controller';

@Module({
  controllers: [AdminNotificationController],
})
export class AdminNotificationModule {}
