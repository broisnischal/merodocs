import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { createProblemDto } from './dtos/create-problem.dto';
import { updateProblemDto } from './dtos/update-problem.dto';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { ParamId } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';

@Controller('problem')
export class ProblemController {
  constructor(private readonly service: ProblemService) {}

  @Post()
  async create(
    @Body() postData: createProblemDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Problem created successfully',
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

  @Get('')
  async getAll(
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateProblemDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Problem updated successfully',
      data,
    });
  }

  @Put(':id/multiple-attachments')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadMultipleAttachments(
    @UploadedFiles(createParseFilePipeBuiler('document'))
    files: Express.Multer.File[],
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.uploadMultipeAttachments({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
      postData: files,
    });

    return new HttpResponse({
      message: 'Attachments uploaded successfully',
    });
  }

  @Put(':id/attachment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @UploadedFile(createParseFilePipeBuiler('document'))
    file: Express.Multer.File,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.uploadAttachment({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
      postData: file,
    });
    return new HttpResponse({
      message: 'Attachment uploaded successfully',
      data,
    });
  }

  @Delete(':id/attachment')
  async deleteAttachment(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.deleteAttachment({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Attachment deleted successfully',
    });
  }
}
