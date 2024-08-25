import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../common/decorators';
import { updateApartmentDto } from './dtos/update-apartment.dto';

@Controller('apartment')
export class ApartmentController {
  constructor(private readonly service: ApartmentService) {}

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateApartmentDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Apartment updated successfully',
      data,
    });
  }

  @Get()
  async getAll() {
    const data = await this.service.getAll();
    return new HttpResponse({
      message: 'Apartment fetched successfully',
      data,
    });
  }
}
