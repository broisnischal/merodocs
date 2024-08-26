import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from '../../common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('detail')
  async getDetail(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getDetail({
      id: loggedUserData.apartmentId,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('resident/graph')
  async getResidentGraph(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { month }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getResidentGraph({
      id: loggedUserData.apartmentId,
      apartmentId: loggedUserData.apartmentId,
      month,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('movedout/graph')
  async getMovedOutGraph(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { month }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getMovedOutGraph({
      id: loggedUserData.apartmentId,
      apartmentId: loggedUserData.apartmentId,
      month,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('resident')
  async getResident(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getResident({
      id: loggedUserData.apartmentId,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('occupancy')
  async getOccupancy(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getOccupancy({
      id: loggedUserData.apartmentId,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('poll')
  async getPoll(
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getPoll({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('request')
  async getRequest(
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getRequest({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('ticket')
  async getTicket(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getTicket({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
    });

    return new HttpResponse({
      data,
    });
  }
}
