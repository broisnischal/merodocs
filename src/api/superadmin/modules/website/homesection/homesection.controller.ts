import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { HomeSectionService } from './homesection.service';
import { createHomeSectionDto } from './dtos/index.dto';
import { SuperAdminUser } from '../../../common/decorators';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('home-section')
export class HomeSectionController {
  constructor(private readonly service: HomeSectionService) {}

  @Post('')
  async create(
    @Body() postData: createHomeSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Homesection modified successfully',
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
