import { Controller, Get, Put, Query } from '@nestjs/common';
import { QueryDto } from 'src/common/validator/query.validator';
import { HttpResponse } from 'src/common/utils';
import { GuardNotificationService } from 'src/global/notification/guard-notification.service';
import { GuardUser } from '@prisma/client';
import { CurrentGuardUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';

@Controller('notification')
export class NotificationController {
  constructor(private readonly service: GuardNotificationService) {}

  @Get()
  async getAll(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      page,
      limit,
      guardId: loggedUserData.id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async markAsRead(
    @ParamId() id: string,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    await this.service.markAsRead(id, loggedUserData.id);

    return new HttpResponse({
      message: 'Notification marked as read',
    });
  }
}
