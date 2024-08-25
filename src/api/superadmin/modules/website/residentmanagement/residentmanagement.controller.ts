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
import { ResidentManagementService } from './residentmanagement.service';
import { createResidentManagementSectionDto } from './dtos/create-residentmanagement.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { getResidentManagementQueryDto } from './dtos/get-residentmanagement.dto';
import {
  createResidentManagementFeatureDto,
  updateResidentManagementFeatureDto,
} from './dtos/create-residentmanagementfeature.dto';
import { ParamId } from 'src/common/decorators';

@Controller('residentmanagement')
export class ResidentManagementController {
  constructor(private readonly service: ResidentManagementService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upsert(
    @Body() postData: createResidentManagementSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file?: Express.Multer.File,
  ): Promise<HttpResponse> {
    await this.service.upsert({
      postData: {
        ...postData,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Section saved successfully',
    });
  }

  @Get()
  async get(
    @Query() { type }: getResidentManagementQueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.get({
      type,
    });

    return new HttpResponse({
      data,
    });
  }

  @Post('feature')
  async addFeature(
    @Body() postData: createResidentManagementFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.addFeature({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Feature added successfully',
    });
  }

  @Put('feature/:id')
  async updateFeature(
    @ParamId() id: string,
    @Body() postData: updateResidentManagementFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.updateFeature({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Feature updated successfully',
    });
  }

  @Delete('feature/:id')
  async removeFeature(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.removeFeature({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Feature removed successfully',
    });
  }
}
