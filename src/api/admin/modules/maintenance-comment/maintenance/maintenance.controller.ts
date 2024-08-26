import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { HttpResponse } from 'src/common/utils';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from '../../../common/decorators';
import { ParamId } from 'src/common/decorators';
import { updateMaintenanceDto } from './dtos/maintenance.dto';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Get(':id')
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

  @Get()
  async getAll(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit, q, ticketStatus, ticketType }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      q,
      extended: {
        ticketStatus,
        ticketType,
      },
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateMaintenanceDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Maintenance updated successfully',
      data,
    });
  }

  @Put('read/:id')
  async read(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.read({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: undefined,
    });

    return new HttpResponse({
      message: 'Maintenance comment read successfully',
      data,
    });
  }
}
