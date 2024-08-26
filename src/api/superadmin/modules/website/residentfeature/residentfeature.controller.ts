import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ResidentFeatureService } from './residentfeature.service';
import { ParamId } from 'src/common/decorators';
import { createResidentFeatureDto } from './dtos/create-residentfeature.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { updateResidentFeatureDto } from './dtos/update-residentfeature.dto';

@Controller('resident-feature')
export class ResidentFeatureController {
  constructor(private readonly service: ResidentFeatureService) {}

  @Post(':id')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @ParamId() id: string,
    @Body() body: createResidentFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('image')) file: Express.Multer.File,
  ) {
    const data = await this.service.create({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Resident feature created successfully',
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @ParamId() id: string,
    @Body() body: updateResidentFeatureDto,
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
      message: 'Resident feature updated successfully',
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
      message: 'Resident feature deleted successfully',
      data,
    });
  }
}
