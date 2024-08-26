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
import { ManagementStatisticService } from './managementstatistic.service';
import { createManagementStatisticSectionDto } from './dtos/create-managementstatistic.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import {
  createManagementStatFeatureDto,
  updateManagementStatFeatureDto,
} from './dtos/create-managementstatsectionfeat.dto';
import { ParamId } from 'src/common/decorators';

@Controller('managementstatistic')
export class ManagementStatisticController {
  constructor(private readonly service: ManagementStatisticService) {}

  @Post()
  async upsert(
    @Body() postData: createManagementStatisticSectionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.upsert({
      postData: {
        ...postData,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Statistics saved successfully',
    });
  }

  @Get()
  async get(): Promise<HttpResponse> {
    const data = await this.service.get();

    return new HttpResponse({
      data,
    });
  }

  @Post('feature')
  @UseInterceptors(FileInterceptor('file'))
  async addFeature(
    @Body() postData: createManagementStatFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ): Promise<HttpResponse> {
    await this.service.addFeature({
      postData: {
        ...postData,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Feature added successfully',
    });
  }

  @Put('feature/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateFeature(
    @ParamId() id: string,
    @Body() postData: updateManagementStatFeatureDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file?: Express.Multer.File,
  ): Promise<HttpResponse> {
    await this.service.updateFeature({
      id,
      postData: {
        ...postData,
        file,
      },
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
