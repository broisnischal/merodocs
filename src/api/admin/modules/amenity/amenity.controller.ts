import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { AdminLoggedUser } from '../../common/decorators';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { createAmenityDto, updateAmenityDto } from './dtos/index.dto';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from '../../../../common/validator/query.validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';

@Controller('amenity')
export class AmenityController {
  constructor(
    private readonly service: AmenityService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  async create(
    @Body() postData: createAmenityDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Amenity created successfully',
      data,
    });
  }

  @Get('activity')
  async getActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: 'amenity',
    });

    return new HttpResponse({
      ...data,
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

  @Get('')
  async getAll(
    @AdminLoggedUser()
    loggedUserData: AdminUser,
    @Query() { archive }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateAmenityDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Amenity updated successfully',
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
      message: `Amenity ${data.archive ? 'archived' : 'restored'} successfully`,
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
      message: 'Amenity deleted successfully',
      data,
    });
  }

  @Put(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @AdminLoggedUser()
    loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.upload({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
      postData: file,
    });
    return new HttpResponse({
      message: 'Image uploaded successfully',
      data,
    });
  }
}
