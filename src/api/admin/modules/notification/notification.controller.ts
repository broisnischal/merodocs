import { Controller, Get, Put, Query } from '@nestjs/common';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminLoggedUser } from '../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { AdminUser } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { AdminNotificationService } from 'src/global/notification/admin-notification.service';

@Controller('notification')
export class AdminNotificationController {
  constructor(private readonly service: AdminNotificationService) {}

  @Get()
  async getAll(
    @Query() { page, limit }: QueryDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      page,
      limit,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('read')
  async read(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    await this.service.markAllAsRead(loggedUserData.apartmentId);

    return new HttpResponse({
      message: 'Notification read successfully',
    });
  }

  @Put(':id/read')
  async readById(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    await this.service.markAsRead({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Notification read successfully',
    });
  }
}
