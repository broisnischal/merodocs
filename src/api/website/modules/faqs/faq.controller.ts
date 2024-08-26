import { Controller, Get, Param } from '@nestjs/common';
import { FAQService } from './faq.service';
import { HttpResponse } from 'src/common/utils';
import { getFAQsDto } from './dtos/get-faqs.dto';

@Controller('faqs')
export class FAQController {
  constructor(private readonly service: FAQService) {}

  @Get('all')
  async getAll() {
    const data = await this.service.getAll();

    return new HttpResponse({
      data,
    });
  }

  @Get(':for')
  async get(@Param() { for: forType }: getFAQsDto) {
    const faqs = await this.service.get({
      forType,
    });

    return new HttpResponse({
      data: faqs,
    });
  }
}
