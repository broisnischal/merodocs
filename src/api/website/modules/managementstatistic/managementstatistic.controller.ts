import { Controller, Get } from '@nestjs/common';
import { HttpResponse } from 'src/common/utils';
import { ManagementStatisticService } from './managementstatistic.service';

@Controller('managementstatistic')
export class ManagementStatisticController {
  constructor(private readonly service: ManagementStatisticService) {}

  @Get()
  async get() {
    const data = await this.service.get();

    return new HttpResponse({
      data,
    });
  }
}
