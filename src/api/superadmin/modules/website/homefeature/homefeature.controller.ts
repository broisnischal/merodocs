import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { HomeFeatureService } from './homefeature.service';
import { ParamId } from 'src/common/decorators';
import { createHomeFeatureDto } from './dtos/create-homefeature.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { updateHomeFeatureDto } from './dtos/update-homefeature.dto';

@Controller('home-feature')
export class HomeFeatureController {
  constructor(private readonly service: HomeFeatureService) {}

  @Post(':id')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @ParamId() id: string,
    @Body() body: createHomeFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('image')) file: Express.Multer.File,
  ) {
    const data = await this.service.create({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Home feature created successfully',
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @ParamId() id: string,
    @Body() body: updateHomeFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const data = await this.service.update({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Home feature updated successfully',
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
      message: 'Home feature deleted successfully',
      data,
    });
  }
}
