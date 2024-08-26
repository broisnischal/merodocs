import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { GalleryDocumentService } from './gallery-document.service';
import { createFolderDto } from './dtos/create-folder.dto';
import { ParamId } from 'src/common/decorators/id-param.decorator';
import { updateFolderDto } from './dtos/update-folder.dto';
import { HttpResponse } from 'src/common/utils';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from '../../common/decorators';
import { QueryDto } from '../../../../common/validator/query.validator';
import { folderParamDto } from '../../common/validator/folder.validator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { deleteMultipleFilesDto } from './dtos/delete-multiplefiles.dto';

@Controller('gd/:type')
export class GalleryDocumentController {
  constructor(
    private readonly service: GalleryDocumentService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() postData: createFolderDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Param() { type }: folderParamDto,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      type,
    });

    return new HttpResponse({
      message: 'Folder created successfully',
      data,
    });
  }

  @Get()
  async getAll(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { archive, access }: QueryDto,
    @Param() { type }: folderParamDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
      access,
      type,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('activity')
  async getActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Param() { type }: folderParamDto,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type,
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get(':id')
  async getSingle(
    @ParamId() id: string,
    @Param() { type }: folderParamDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
      type,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateFolderDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Param() { type }: folderParamDto,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      type,
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Folder updated successfully',
      data,
    });
  }

  @Put(':id/archive')
  async archiveOrRestore(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
    @Param() { type }: folderParamDto,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      type,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Folder ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Param() { type }: folderParamDto,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      type,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Folder deleted successfully`,
    });
  }

  @Post(':id/multiple-images')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadMultipleImage(
    @UploadedFiles(createParseFilePipeBuiler('image'))
    files: Express.Multer.File[],
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
    @Param() { type }: folderParamDto,
  ): Promise<HttpResponse> {
    if (type !== 'gallery') throw new NotFoundException('Route not found');

    await this.service.uploadMultiple({
      apartmentId: loggedUserData.apartmentId,
      id: id,
      loggedUserData,
      postData: files,
      type,
    });

    return new HttpResponse({
      message: 'Image uploaded successfully',
    });
  }

  @Put(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
    @Param() { type }: folderParamDto,
    @Query() { withId }: QueryDto,
  ): Promise<HttpResponse> {
    if (type !== 'gallery') throw new NotFoundException('Route not found');

    const data = await this.service.upload({
      apartmentId: loggedUserData.apartmentId,
      id: id,
      loggedUserData,
      postData: file,
      type,
      withId,
    });
    return new HttpResponse({
      message: 'Image uploaded successfully',
      data,
    });
  }

  @Put(':id/document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(createParseFilePipeBuiler('document'))
    file: Express.Multer.File,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
    @Param() { type }: folderParamDto,
    @Query() { withId }: QueryDto,
  ): Promise<HttpResponse> {
    if (type !== 'document') throw new NotFoundException('Route not found');

    const data = await this.service.upload({
      apartmentId: loggedUserData.apartmentId,
      id: id,
      loggedUserData,
      postData: file,
      type,
      withId,
    });
    return new HttpResponse({
      message: 'Document uploaded successfully',
      data,
    });
  }

  @Delete('file/:id')
  async deleteFile(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Param() { type }: folderParamDto,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.deleteFile({
      id,
      type,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: `File deleted successfully`,
    });
  }

  @Delete(':id/files')
  async deleteMultipleFile(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Param() { type }: folderParamDto,
    @ParamId() id: string,
    @Query() { ids }: deleteMultipleFilesDto,
  ): Promise<HttpResponse> {
    await this.service.deleteMultipleFile({
      id,
      type,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      ids,
    });

    return new HttpResponse({
      message: `Files deleted successfully`,
    });
  }
}
