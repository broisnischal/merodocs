import { Module } from '@nestjs/common';
import { CheckInApprovalController } from './checkin-approval.controller';
import { CheckInApprovalService } from './checkin-approval.service';

@Module({
  controllers: [CheckInApprovalController],
  providers: [CheckInApprovalService],
})
export class CheckInApprovalModule {}
