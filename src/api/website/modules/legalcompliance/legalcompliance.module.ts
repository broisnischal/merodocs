import { Module } from '@nestjs/common';
import { LegalComplianceController } from './legalcompliance.controller';
import { LegalComplianceService } from './legalcompliance.service';

@Module({
  controllers: [LegalComplianceController],
  providers: [LegalComplianceService],
})
export class LegalComplianceModule {}
