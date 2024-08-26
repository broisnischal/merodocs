import { Module } from '@nestjs/common';
import { ServiceShiftController } from './serviceshift.controller';
import { ServiceShiftService } from './serviceshift.service';

@Module({
  controllers: [ServiceShiftController],
  providers: [ServiceShiftService],
})
export class ServiceShiftModule {}
