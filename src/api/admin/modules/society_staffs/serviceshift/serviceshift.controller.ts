import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { ServiceShiftService } from './serviceshift.service';
import { createAdminServiceShiftDto, updateAdminServiceShiftDto } from './dtos';

@Controller('serviceshift')
export class ServiceShiftController {
  constructor(private readonly service: ServiceShiftService) {}

  @Post()
  async create(
    @Body()
    postData: createAdminServiceShiftDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const user = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Shift created successfully',
      data: user,
    });
  }

  @Get()
  async getAll(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { archive }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get(':id')
  async getSingle(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @Body() postData: updateAdminServiceShiftDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      apartmentId: loggedUserData.apartmentId,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Shift updated successfully',
      data,
    });
  }

  @Put(':id/archive')
  async archiveOrRestore(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Shift ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Shift deleted successfully`,
    });
  }
}
