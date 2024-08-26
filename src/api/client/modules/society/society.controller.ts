import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SocietyService } from './society.service';
import { Public } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { Apartment } from '../../common/decorators';

@Controller('society')
export class SocietyController {
  constructor(private readonly service: SocietyService) {}

  @Public()
  @Get()
  async getSociety(@Query() { q }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getSociety({ q, apartmentId: '' });

    return new HttpResponse({
      data,
    });
  }

  @Public()
  @Get('/block')
  async getBlock(@Query() { withId }: QueryDto): Promise<HttpResponse> {
    if (!withId) throw new NotFoundException('Query is required (withId)');
    const data = await this.service.getBlock({
      apartmentId: withId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Public()
  @Get('/flat')
  async getFlat(@Query() { withId, q }: QueryDto): Promise<HttpResponse> {
    if (!withId) throw new NotFoundException('Query is required (withId)');
    const data = await this.service.getFlat({
      apartmentId: '',
      withId,
      q,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/guard')
  async getGuard(
    @Apartment() apartment: string,
    @Query() { filter }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getGuard({
      apartmentId: apartment,
      filter,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/banner')
  async getBanner(@Apartment() apartment: string): Promise<HttpResponse> {
    const data = await this.service.getBanner({
      apartmentId: apartment,
    });

    return new HttpResponse({
      message: 'Banner listed below:',
      data,
    });
  }

  @Get('/background')
  async getBackground(): Promise<HttpResponse> {
    const data = await this.service.getBackground();

    return new HttpResponse({
      message: 'Backgrounds listed below:',
      data,
    });
  }
}
