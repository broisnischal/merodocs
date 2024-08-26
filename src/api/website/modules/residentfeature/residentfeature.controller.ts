import { Controller, Get } from '@nestjs/common';
import { ResidentFeatureService } from './residentfeature.service';
import { HttpResponse } from 'src/common/utils';

@Controller('residentfeature')
export class ResidentFeatureController {
  constructor(private readonly service: ResidentFeatureService) {}

  @Get('')
  async getAll() {
    const data = await this.service.getAll();

    return new HttpResponse({
      data,
    });
  }
}
