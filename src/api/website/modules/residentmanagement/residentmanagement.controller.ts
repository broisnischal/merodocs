import { Controller, Get } from '@nestjs/common';
import { ResidentManagementService } from './residentmanagement.service';
import { HttpResponse } from 'src/common/utils';

@Controller('residentmanagement')
export class ResidentManagementController {
  constructor(private readonly service: ResidentManagementService) {}

  @Get()
  async get(): Promise<HttpResponse> {
    const data = await this.service.get();

    return new HttpResponse({
      data,
    });
  }
}
