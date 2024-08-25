import { Controller, Get, Param } from '@nestjs/common';
import { LegalComplianceService } from './legalcompliance.service';
import { HttpResponse } from 'src/common/utils';
import { getLegalComplianceDto } from './dtos/get-legalCompliance.dto';

@Controller('legalcompliance')
export class LegalComplianceController {
  constructor(private readonly service: LegalComplianceService) {}

  @Get(':type')
  async get(@Param() { type }: getLegalComplianceDto): Promise<HttpResponse> {
    const data = await this.service.get({
      type,
    });

    return new HttpResponse({
      data,
    });
  }
}
