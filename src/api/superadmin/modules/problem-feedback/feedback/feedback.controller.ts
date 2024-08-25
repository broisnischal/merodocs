import { Controller, Get, Query } from '@nestjs/common';
import { ParamId } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { FeedbackService } from './feedback.service';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get('/:id')
  async getSingle(@ParamId() id: string): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

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
}
