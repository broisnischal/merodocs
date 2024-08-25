import { Module } from '@nestjs/common';
import { AdminShiftController } from './adminshift.controller';
import { AdminShiftService } from './adminshift.service';

@Module({
  controllers: [AdminShiftController],
  providers: [AdminShiftService],
})
export class AdminShiftModule {}
