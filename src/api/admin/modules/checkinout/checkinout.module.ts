import { Module } from '@nestjs/common';
import { CheckInOutController } from './checkinout.controller';
import { CheckInOutService } from './checkinout.service';

@Module({
  controllers: [CheckInOutController],
  providers: [CheckInOutService],
})
export class CheckInOutModule {}
