import { Controller, Get, Put, Query } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CurrentGuardUser } from '../../common/decorators';
import { GuardUser } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('alert')
export class AlertController {
  constructor(private readonly service: AlertService) {}

  @Get(':id')
  async get(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.getAlert({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async respond(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.respond({
      id,
      postData: undefined,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Alert responded successfully',
      data,
    });
  }

  @Get('')
  async getHistory(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { historyDate, page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAlertHistory({
      apartmentId: loggedUserData.apartmentId,
      extended: { historyDate, page, limit },
    });

    return new HttpResponse({
      data,
    });
  }
}
