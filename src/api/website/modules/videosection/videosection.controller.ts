import { Controller, Get, Query } from '@nestjs/common';
import { VideoSectionService } from './videosection.service';

import { HttpResponse } from 'src/common/utils';
import { getVideoSectionDto } from './dtos/get-videosection.dto';

@Controller('videosection')
export class VideoSectionController {
  constructor(private readonly service: VideoSectionService) {}

  @Get('')
  async getByType(@Query() type: getVideoSectionDto): Promise<HttpResponse> {
    const data = await this.service.getByType(type);

    return new HttpResponse({
      data,
    });
  }
}
