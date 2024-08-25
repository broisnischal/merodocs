import { Controller, Get, Put, Query } from '@nestjs/common';
import { QueryDto } from 'src/common/validator/query.validator';
import { HttpResponse } from 'src/common/utils';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import { FlatClientUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';

@Controller('notification')
export class NotificationController {
  constructor(private readonly service: ClientNotificationService) {}

  @Get()
  async getAll(
    @FlatClientUser() user: FlatClientUserAuth,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      page,
      limit,
      clientId: user.id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async markAsRead(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    await this.service.markAsRead(id, user.id);

    return new HttpResponse({
      message: 'Notification marked as read',
    });
  }
}
