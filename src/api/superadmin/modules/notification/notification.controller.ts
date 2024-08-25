import { Controller, Get, Put, Query } from '@nestjs/common';
import { QueryDto } from 'src/common/validator/query.validator';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';
import { SuperAdminNotificationService } from 'src/global/notification/superadmin-notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly service: SuperAdminNotificationService) {}

  @Get()
  async getAll(@Query() { page, limit }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll({
      page,
      limit,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('read')
  async read(): Promise<HttpResponse> {
    await this.service.markAllAsRead();

    return new HttpResponse({
      message: 'Notification read successfully',
    });
  }

  @Put(':id/read')
  async readById(@ParamId() id: string): Promise<HttpResponse> {
    await this.service.markAsRead({
      id,
    });

    return new HttpResponse({
      message: 'Notification read successfully',
    });
  }
}
