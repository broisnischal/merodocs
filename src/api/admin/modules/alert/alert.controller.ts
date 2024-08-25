import { Controller, Get } from '@nestjs/common';
import { AlertService } from './alert.service';

import { HttpResponse } from 'src/common/utils';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from '../../common/decorators';

@Controller('alert')
export class AlertController {
  constructor(private readonly service: AlertService) {}

  @Get('')
  async getLogs(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.GetAll({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
