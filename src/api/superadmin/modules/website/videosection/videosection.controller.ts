import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VideoSectionService as VideoSectionService } from './videosection.service';
import { createVideoSectionDto, updateVideoSectionDto } from './dtos/index.dto';
import { SuperAdminUser } from '../../../common/decorators';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';

@Controller('video-section')
export class VideoSectionController {
  constructor(private readonly service: VideoSectionService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @Body() body: createVideoSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('video'))
    file: Express.Multer.File,
  ) {
    const data = await this.service.create({
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Video section created successfully',
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('video'))
  async update(
    @Body() body: updateVideoSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
    @UploadedFile(createOptionalParseFilePipeBuiler('video'))
    file: Express.Multer.File,
  ) {
    const data = await this.service.update({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Video section updated successfully',
      data,
    });
  }

  @Get('')
  async get() {
    const data = await this.service.getAll();

    return new HttpResponse({
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Video section deleted successfully',
      data,
    });
  }
}
