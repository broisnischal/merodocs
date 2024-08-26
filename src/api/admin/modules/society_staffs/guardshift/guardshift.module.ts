import { Module } from '@nestjs/common';
import { GuardShiftController } from './guardshift.controller';
import { GuardShiftService } from './guardshift.service';

@Module({
  controllers: [GuardShiftController],
  providers: [GuardShiftService],
})
export class GuardShiftModule {}
