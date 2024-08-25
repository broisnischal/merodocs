import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { NoticeService } from './notice.service';
import { createNoticeDto } from './dtos/create-notice.dto';
import { AdminLoggedUser } from '../../../common/decorators';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from '../../../../../common/validator/query.validator';
import { updateNoticeDto } from './dtos/update-notice.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Controller('notice')
export class NoticeController {
  constructor(
    private readonly service: NoticeService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  async create(
    @Body() postData: createNoticeDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Notice created successfully',
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
      type: 'notice',
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
    @Body() postData: updateNoticeDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Notice updated successfully',
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
      message: `Notice ${data.archive ? 'archived' : 'restored'} successfully`,
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
      message: 'Notice deleted successfully',
      data,
    });
  }

  @Put('/:id/document')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadImage(
    @UploadedFiles(createParseFilePipeBuiler('document'))
    files: Express.Multer.File[],
    @AdminLoggedUser()
    loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.upload({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
      postData: files,
    });
    return new HttpResponse({
      message: 'Notices uploaded successfully',
    });
  }
}
