import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { HttpResponse } from 'src/common/utils';
import { SuperAdminUser } from '../../../common/decorators';
import { SuperAdmin } from '@prisma/client';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import { UpdateRoleDto } from './dto/update-role';

@Controller('role')
export class RoleController {
  constructor(
    private readonly service: RoleService,
    private readonly activityService: SuperAdminActivityService,
  ) {}

  @Post()
  async create(
    @Body() postData: CreateRoleDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.create({ postData, loggedUserData });

    return new HttpResponse({
      data,
    });
  }

  @Get('constant')
  async getConstant(): Promise<HttpResponse> {
    const data = await this.service.getRolesConstants();
    return new HttpResponse({
      data,
    });
  }

  @Get()
  async getAll(@Query() { archive }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll({
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @Body() postData: UpdateRoleDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.update({ id, postData, loggedUserData });

    return new HttpResponse({
      data,
    });
  }

  @Get('activity')
  async getActivity(@Query() { page, limit }: QueryDto): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      page,
      limit,
      type: 'auth',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get(':id')
  async getSingle(@ParamId() id: string): Promise<HttpResponse> {
    const data = await this.service.getDetails({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id/archive')
  async archiveOrRestore(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
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
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Role deleted successfully`,
    });
  }
}
