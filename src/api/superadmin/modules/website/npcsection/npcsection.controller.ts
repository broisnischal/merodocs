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
import { NPCSectionService } from './npcsection.service';
import { createNPCSectionDto } from './dtos/create-npc.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { getNPCQueryDto } from './dtos/get-npc.dto';
import {
  createNPCFeatureDto,
  updateNPCFeatureDto,
} from './dtos/create-npcfeature.dto';
import { ParamId } from 'src/common/decorators';

@Controller('npcsection')
export class NPCSectionController {
  constructor(private readonly service: NPCSectionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upsert(
    @Body() postData: createNPCSectionDto,
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
      message: 'NPC Section saved successfully',
    });
  }

  @Get()
  async get(
    @Query() { for: forType, type }: getNPCQueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.get({
      for: forType,
      type,
    });

    return new HttpResponse({
      data,
    });
  }

  @Post('feature')
  async addFeature(
    @Body() postData: createNPCFeatureDto,
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
    @Body() postData: updateNPCFeatureDto,
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
