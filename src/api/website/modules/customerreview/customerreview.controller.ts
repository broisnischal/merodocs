import { Controller, Get } from '@nestjs/common';
import { CustomerReviewService } from './customerreview.service';
import { HttpResponse } from 'src/common/utils';

@Controller('customerreview')
export class CustomerReviewController {
  constructor(private readonly service: CustomerReviewService) {}

  @Get()
  async get(): Promise<HttpResponse> {
    const data = await this.service.getAll();

    return new HttpResponse({
      data,
    });
  }
}
