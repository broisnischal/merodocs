import { Controller, Get } from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';

@Controller('apartment')
export class ApartmentController {
  constructor(private readonly service: ApartmentService) {}

  @Get('detail/:flatId')
  async get(@ParamId('flatId') flatId: string) {
    const data = await this.service.getApartmentDetails(flatId);

    return new HttpResponse({
      message: 'Apartment details retrived successfully',
      data: data,
    });
  }
}
