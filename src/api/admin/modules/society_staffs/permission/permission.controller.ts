import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { createPermissionDto } from './dtos/create-permssion.dto';
import { bulkCreatePermissionDto } from './dtos/bulkcreate-permission.dto';
import { updatePermissionDto } from './dtos/update-permission.dto';
import { ParamId } from 'src/common/decorators/id-param.decorator';
import { HttpResponse, enumToArray } from 'src/common/utils';
import { AccessRightEnum } from '@prisma/client';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { RoutePermissionCollection } from 'src/api/admin/common/enums';

@Controller('permission')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Post()
  async create(
    @Body()
    postData: createPermissionDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData: loggedUserData,
    });

    return new HttpResponse({
      message: 'Permission created successfully',
      data,
    });
  }

  @Post('/bulk')
  async bulkCreate(
    @Body()
    postData: bulkCreatePermissionDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    await this.service.bulkCreate({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Permissions created successfully',
    });
  }

  @Put('/:id')
  async update(
    @Body()
    postData: updatePermissionDto,
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Permission updated successfully',
      data,
    });
  }

  @Delete('/:id')
  async delete(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Permission deleted successfully',
    });
  }

  @Get('/name-access')
  async getNameAccess(): Promise<HttpResponse> {
    const data = {
      names: RoutePermissionCollection,
      access: enumToArray(AccessRightEnum),
    };

    return new HttpResponse({
      data,
    });
  }
}
