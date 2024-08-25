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
import { AboutUsSectionService } from './aboutussection.service';
import {
  createAboutUsServiceDto,
  createAboutUsStoryDto,
  updateAboutUsServiceDto,
} from './dtos/index.dto';
import { SuperAdminUser } from '../../../common/decorators';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';

@Controller('about-us-section')
export class AboutUsSectionController {
  constructor(private readonly service: AboutUsSectionService) {}

  @Post('story')
  async createStory(
    @Body() postData: createAboutUsStoryDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.createStory({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'About us story modified successfully',
      data,
    });
  }

  @Get('story')
  async getAllStory() {
    const data = await this.service.getAllStory();

    return new HttpResponse({
      data,
    });
  }

  @Post('service')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() body: createAboutUsServiceDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('image')) file: Express.Multer.File,
  ) {
    const data = await this.service.createService({
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'About us service created successfully',
      data,
    });
  }

  @Get('service')
  async getAllService() {
    const data = await this.service.getAllService();

    return new HttpResponse({
      data,
    });
  }

  @Put('service/:id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @ParamId() id: string,
    @Body() body: updateAboutUsServiceDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const data = await this.service.updateService({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'About us service updated successfully',
      data,
    });
  }

  @Delete('service/:id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.deleteService({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'About us service deleted successfully',
      data,
    });
  }
}
