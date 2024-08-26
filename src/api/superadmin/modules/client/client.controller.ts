import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { updateClientDto } from './dtos/update-client.dto';
import { SuperAdmin } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { SuperAdminUser } from '../../common/decorators';
import { createClientDto } from './dtos/create-client.dto';
import { checkUniqueDto } from './dtos/check-unique.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('clients')
export class ClientController {
  constructor(private readonly service: ClientService) {}

  @Post('check')
  @HttpCode(200)
  async checkUnique(
    @Body() postData: checkUniqueDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.checkUnique({
      postData,
      loggedUserData,
    });

    return new HttpResponse({});
  }

  @Post()
  async create(
    @Body()
    postData: createClientDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'User created successfully',
      data,
    });
  }

  @Get('document-type')
  async getAllDocuments() {
    const data = await this.service.getAllDocuments();

    return new HttpResponse({
      data,
    });
  }

  @Get('')
  async getAll(@Query() { page, limit, filter, q, subscription }: QueryDto) {
    const data = await this.service.getAll({
      page,
      limit,
      filter,
      q,
      subscription,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/details/:id')
  async getDetail(@ParamId() id: string) {
    const data = await this.service.getDetails({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/subscription/:id')
  async getSubscitption(@ParamId() id: string) {
    const data = await this.service.getSubscription({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/document/:id')
  async get(@ParamId() id: string) {
    const data = await this.service.getDocuments({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateClientDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Client updated successfully',
      data,
    });
  }

  @Put('/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.upload({
      id,
      loggedUserData,
      postData: file,
    });
    return new HttpResponse({
      message: 'Image uploaded successfully',
      data,
    });
  }

  @Put('/:id/document/:documentId')
  @UseInterceptors(FilesInterceptor('file'))
  async uploadMultipleDocuments(
    @UploadedFiles(createParseFilePipeBuiler('document'))
    files: Express.Multer.File[],
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @Param() { id, documentId }: { id: string; documentId: string },
  ): Promise<HttpResponse> {
    const data = await this.service.uploadMultipleDocuments({
      id,
      loggedUserData,
      postData: files,
      withId: documentId,
    });
    return new HttpResponse({
      message: 'Documents uploaded successfully',
      data,
    });
  }

  @Delete('/:id')
  async delete(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.deleteClient({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Client deleted successfully',
    });
  }

  @Delete('/:id/document')
  async deleteDocument(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.deleteDocument({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Attachment deleted successfully',
    });
  }
}
