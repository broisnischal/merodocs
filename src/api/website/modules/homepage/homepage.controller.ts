import { Controller, Get, Query } from '@nestjs/common';
import { HomePageService } from './homepage.service';
import { HttpResponse } from 'src/common/utils';
import { getHomePageQueryDto } from './dtos/get-homepage.dto';

@Controller('homepage')
export class HomePageController {
  constructor(private readonly service: HomePageService) {}

  @Get('')
  async get(): Promise<HttpResponse> {
    const data = await this.service.getAll();

    return new HttpResponse({
      data,
    });
  }

  @Get('/type')
  async getByType(@Query() type: getHomePageQueryDto): Promise<HttpResponse> {
    const data = await this.service.getByType(type);

    return new HttpResponse({
      data,
    });
  }
}
