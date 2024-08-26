import { Controller, Get, Put } from '@nestjs/common';
import { ColorService } from './color.service';
import { HttpResponse } from 'src/common/utils';
import { AdminUser } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { AdminLoggedUser } from '../../common/decorators';

@Controller('color')
export class ColorController {
  constructor(private readonly service: ColorService) {}

  @Get('')
  async getAll(): Promise<HttpResponse> {
    const data = await this.service.getAll();
    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: undefined,
    });

    return new HttpResponse({
      message: 'Apartment updated successfully',
      data,
    });
  }

  @Put('')
  async restore(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.restore({
      id: '',
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: undefined,
    });

    return new HttpResponse({
      message: 'Color removed successfully',
      data,
    });
  }
}
