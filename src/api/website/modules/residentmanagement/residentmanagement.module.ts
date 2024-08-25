import { Module } from '@nestjs/common';
import { ResidentManagementController } from './residentmanagement.controller';
import { ResidentManagementService } from './residentmanagement.service';

@Module({
  controllers: [ResidentManagementController],
  providers: [ResidentManagementService],
})
export class ResidentManagementModule {}
