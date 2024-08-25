import { Body, Controller, Get, Post } from '@nestjs/common';
import { RFSectionService } from './rfsection.service';
import { createRFSectionDto } from './dtos/index.dto';
import { SuperAdminUser } from '../../../common/decorators';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';

@Controller('resident-feature-section')
export class RFSectionController {
  constructor(private readonly service: RFSectionService) {}

  @Post('')
  async create(
    @Body() postData: createRFSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Resident feature section modified successfully',
      data,
    });
  }

  @Get('')
  async getAll() {
    const data = await this.service.getAll();

    return new HttpResponse({
      data,
    });
  }
}
