import { Controller, Get, Query } from '@nestjs/common';
import { WhyUsSectionService } from './whyussection.service';
import { HttpResponse } from 'src/common/utils';
import { getWhyUsSectionQueryDto } from './dtos/get-whyussection.dto';

@Controller('whyus')
export class WhyUsSectionController {
  constructor(private readonly service: WhyUsSectionService) {}

  @Get('')
  async get(@Query() type: getWhyUsSectionQueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll(type);

    return new HttpResponse({
      data,
    });
  }
}
