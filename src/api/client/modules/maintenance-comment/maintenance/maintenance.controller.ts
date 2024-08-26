import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { createMaintenanceDto } from './dtos/maintenance.dto';
import { FlatClientUser } from '../../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles(createOptionalParseFilePipeBuiler('both'))
    files: Express.Multer.File[],
    @Body() body: createMaintenanceDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      user,
      body: {
        ...body,
        files,
      },
    });

    return new HttpResponse({
      data,
    });
  }

  @Get()
  async getAll(
    @Query() { filter }: QueryDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      filter,
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get(':id')
  async getSingle(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.get({
      id,
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.upload({
      id,
      body: file,
      user,
    });

    return new HttpResponse({
      message: 'Image uploaded successfully',
    });
  }
}
