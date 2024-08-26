import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { createRoleDto } from './dtos/create-role.dto';
import { ParamId } from 'src/common/decorators/id-param.decorator';
import { updateRoleDto } from './dtos/update-role.dto';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { AdminUser } from '@prisma/client';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Controller('role')
export class RoleController {
  constructor(
    private readonly service: RoleService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() postData: createRoleDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Role created successfully',
      data,
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

  @Get('activity')
  async getActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: 'role',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('/:id')
  async getSingle(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateRoleDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Role updated successfully',
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
      message: `Role ${data.archive ? 'archived' : 'restored'} successfully`,
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
      message: `Role deleted successfully`,
    });
  }
}
