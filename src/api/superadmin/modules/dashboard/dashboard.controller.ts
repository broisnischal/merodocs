import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('total-clients')
  async getClient(): Promise<HttpResponse> {
    const data = await this.service.getClients();

    return new HttpResponse({
      data,
    });
  }

  @Get('total-revenues')
  async getRevenue(@Query() { month, year }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getRevenue({
      id: '',
      year,
      month,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('expiring-soon')
  async getExpiringClient(
    @Query() { limit, page }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getExpiringClients({
      limit,
      page,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('new-clients')
  async getNewClient(
    @Query() { limit, page }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getNewClients({
      limit,
      page,
    });

    return new HttpResponse({
      data,
    });
  }
}
