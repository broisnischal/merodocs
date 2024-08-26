import { Controller, Get } from '@nestjs/common';
import { AboutUsSectionService } from './aboutussection.service';
import { HttpResponse } from 'src/common/utils';

@Controller('aboutus')
export class AboutUsSectionController {
  constructor(private readonly service: AboutUsSectionService) {}

  @Get('story')
  async getAllStory() {
    const data = await this.service.getAllStory();

    return new HttpResponse({
      data,
    });
  }

  @Get('service')
  async getAllService() {
    const data = await this.service.getAllService();

    return new HttpResponse({
      data,
    });
  }

  @Get('member')
  async getAllMember() {
    const data = await this.service.getMember();

    return new HttpResponse({
      data,
    });
  }
}
