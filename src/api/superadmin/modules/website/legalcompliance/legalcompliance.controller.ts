import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LegalComplianceService } from './legalcompliance.service';
import { createLegalComplianceDto } from './dtos/create-legalcompliance.dto';
import { HttpResponse } from 'src/common/utils';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { getLegalComplianceDto } from './dtos/get-legalCompliance.dto';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import { QueryDto } from 'src/common/validator/query.validator';
import { capitalize } from 'lodash';

@Controller('legalcompliance')
export class LegalComplianceController {
  constructor(
    private readonly service: LegalComplianceService,
    private readonly activityService: SuperAdminActivityService,
  ) {}

  @Post()
  async upsert(
    @Body() postData: createLegalComplianceDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.upsert({
      postData: postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: `${capitalize(postData.type.split('_').join(' '))} saved successfully`,
    });
  }

  @Get('activity')
  async getActivity(@Query() { page, limit }: QueryDto): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      page,
      limit,
      type: 'legalcompliance',
    });

    return new HttpResponse({
      ...data,
    });
  }

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
