import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { createColorDto } from './dtos/create-color';
import { ColorService } from './color.service';
import { HttpResponse } from 'src/common/utils';
import { updateColorDto } from './dtos/update-color';
import { SuperAdmin } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';

@Controller('color')
export class ColorController {
  constructor(private readonly service: ColorService) {}

  @Post()
  async create(
    @Body() postData: createColorDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Color created successfully',
      data,
    });
  }

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
    @Body() postData: updateColorDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      postData,
    });

    return new HttpResponse({
      message: 'Color updated successfully',
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Color deleted successfully',
      data,
    });
  }
}
