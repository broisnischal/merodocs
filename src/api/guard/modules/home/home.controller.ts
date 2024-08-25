import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentGuardUser } from '../../common/decorators';
import { GuardUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { setDefaultSurveillanceDto } from './dtos/set-defaultSurveillance.dto';
import { getVisitorsInOutDto } from './dtos/get-visitorsinout.dto';

@Controller('home')
export class HomeController {
  constructor(private readonly service: HomeService) {}

  @Get('default-surveillance')
  async getDefaultSurveillance(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getDefaultSurveillance(loggedUserData);
    return new HttpResponse({
      data,
    });
  }

  @Put('default-surveillance')
  async setDefaultSurveillance(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: setDefaultSurveillanceDto,
  ) {
    const data = await this.service.setDefaultSurveillance({
      id: loggedUserData.id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData,
    });

    return new HttpResponse({
      data: data.defaultSurveillanceId
        ? data.defaultSurveillanceId
        : data.surveillanceId,
    });
  }

  @Get('visitors')
  async getVisitors(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getVisitors({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('visitors/state')
  async getVisitorsState(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { requestType }: getVisitorsInOutDto,
  ) {
    const data = await this.service.getVisitorsInsideOutsideV2({
      apartmentId: loggedUserData.apartmentId,
      extended: {
        requestType,
      },
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('residental-staffs')
  async getResidentalStaffs(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getResidentalStaffInOut({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('society-staffs')
  async getSocietyStaffs(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getSocietyStaffInOut({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('vehicles')
  async getVehicles(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getVehiclesInOut({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('group')
  async getGroups(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getGroupVisitorsInOut({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
