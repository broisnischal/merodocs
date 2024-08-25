import { Module } from '@nestjs/common';
import { ResidentialStaffController } from './residential_staff.controller';
import { ResidentialStaffService } from './residential_staff.service';

@Module({
  controllers: [ResidentialStaffController],
  providers: [ResidentialStaffService],
})
export class ResidentialStaffModule {}
