import { Controller, Get } from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { FlatClientUser } from '../../common/decorators';
import { HttpResponse } from 'src/common/utils';

@Controller('amenity')
export class AmenityController {
  constructor(private readonly service: AmenityService) {}

  @Get('')
  async getAll(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      user,
    });

    return new HttpResponse({
      data,
    });
  }
}
