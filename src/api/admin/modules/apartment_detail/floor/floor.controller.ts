import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FloorService } from './floor.service';
import {
  checkFloorDto,
  createFloorDto,
  updateFloorDto,
} from './dtos/index.dto';
import { ParamId, Private } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { AdminUser } from '@prisma/client';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('floor')
export class FloorController {
  constructor(private readonly service: FloorService) {}

  @Post('/check')
  @HttpCode(200)
  async checkUnique(
    @Body() postData: checkFloorDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    await this.service.checkUnique({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({});
  }

  @Post()
  async create(
    @Body() postData: createFloorDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Floor created successfully',
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateFloorDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Floor updated successfully',
      data,
    });
  }

  @Put('/:id/archive')
  async archiveOrRestore(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Floor ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Floor deleted successfully',
      data,
    });
  }

  @Get('/list/:id')
  async getAll(
    @ParamId() id: string,
    @Query() { archive }: QueryDto,
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
      withId: id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Private()
  @Get('flats')
  async getAllFloors(
    @Query() { ids }: QueryDto,
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getMultiple({
      apartmentId: loggedUserData.apartmentId,
      ids,
    });

    return new HttpResponse({
      data,
    });
  }
  @Get('/:id')
  async getSingle(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
