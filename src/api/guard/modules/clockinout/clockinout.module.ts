import { Module } from '@nestjs/common';
import { ClockInOutController } from './clockinout.controller';
import { ClockInOutService } from './clockinout.service';

@Module({
  controllers: [ClockInOutController],
  providers: [ClockInOutService],
})
export class ClockInOutModule {}
