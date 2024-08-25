import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WhyUsSectionService as WhyUsSectionService } from './whyussection.service';
import { createWhyUsSectionDto } from './dtos/index.dto';
import { SuperAdminUser } from '../../../common/decorators';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('whyus-section')
export class WhyUsSectionController {
  constructor(private readonly service: WhyUsSectionService) {}

  @Post('')
  async create(
    @Body() postData: createWhyUsSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Why us section modified successfully',
      data,
    });
  }

  @Get('')
  async getAll(@Query() { filter }: QueryDto) {
    const data = await this.service.getAll({ filter });

    return new HttpResponse({
      data,
    });
  }
}
