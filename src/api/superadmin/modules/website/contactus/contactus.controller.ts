import { Body, Controller, Delete, Get, Put, Query } from '@nestjs/common';
import { ContactUsService } from './contactus.service';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';
import { updateContactUsDto } from './dtos/update-contactus.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';

@Controller('contactus')
export class ContactUsController {
  constructor(private readonly service: ContactUsService) {}

  @Get()
  async get(
    @Query() { filter, archive, page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({ filter, archive, page, limit });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateContactUsDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({ id, postData, loggedUserData });

    return new HttpResponse({
      message: 'Request updated successfully',
      data,
    });
  }

  @Put('archive/:id')
  async archive(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrUnarchive({
      id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Request ${data ? 'archived' : 'unarchived'}`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({ id, loggedUserData });

    return new HttpResponse({
      message: 'Request deleted successfully',
      data,
    });
  }
}
