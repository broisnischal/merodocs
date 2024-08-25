import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FlatService } from './flat.service';
import { createFlatDto, updateFlatDto, checkFlatDto } from './dtos';
import { HttpResponse } from 'src/common/utils';

import { ParamId } from 'src/common/decorators';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { getFlatHistoryQueryDto } from './dtos/get-history.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { createOfflineResidentDto } from './dtos/create-offlineresident.dto';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('flat')
export class FlatController {
  constructor(private readonly service: FlatService) {}

  @Post('/check')
  @HttpCode(200)
  async checkUnique(
    @Body() postData: checkFlatDto,
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
    @Body() postData: createFlatDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Flat created successfully',
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateFlatDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Flat updated successfully',
      data,
    });
  }

  @Put('/:id/assign-resident')
  @UseInterceptors(FileInterceptor('image'))
  async assignResident(
    @ParamId() id: string,
    @Body() postData: createOfflineResidentDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    image?: Express.Multer.File,
  ): Promise<HttpResponse> {
    const data = await this.service.assignResidentUser({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: {
        ...postData,
        image,
      },
    });

    return new HttpResponse({
      message: 'Resident assigned successfully',
      data,
    });
  }

  @Get('/:id/history')
  async getHistory(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getFlatUsersHistory({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/history/details')
  async getHistoryDetails(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() queries: getFlatHistoryQueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllHistoryDetailsWithType({
      apartmentId: loggedUserData.apartmentId,
      queries,
    });

    return new HttpResponse({
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
      message: `Flat ${data.archive ? 'archived' : 'restored'} successfully`,
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
      message: 'Flat deleted successfully',
      data,
    });
  }

  @Get('/list/:id')
  async getAll(
    @ParamId() id: string,
    @AdminLoggedUser()
    loggedUserData: AdminUser,
    @Query()
    { archive }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      withId: id,
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/archive/list/:id')
  async getAllArchive(
    @ParamId() id: string,
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllArchive({
      apartmentId: loggedUserData.apartmentId,
      withId: id,
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
