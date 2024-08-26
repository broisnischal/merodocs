import { Module } from '@nestjs/common';
import { CheckInOutController } from './checkinout.controller';
import { CheckInOutService } from './checkinout.service';
import { ClockInOutService } from '../clockinout/clockinout.service';

@Module({
  controllers: [CheckInOutController],
  providers: [CheckInOutService, ClockInOutService],
})
export class CheckInOutModule {}
