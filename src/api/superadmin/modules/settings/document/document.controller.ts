import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { createDocumentDto } from './dtos/create-document';
import { DocumentService } from './document.service';
import { HttpResponse } from 'src/common/utils';
import { updateDocumentDto } from './dtos/update-document';
import { SuperAdmin } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';

@Controller('document-type')
export class DocumentController {
  constructor(
    private readonly service: DocumentService,
    private readonly activityService: SuperAdminActivityService,
  ) {}

  @Post()
  async create(
    @Body() postData: createDocumentDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Document created successfully',
      data,
    });
  }

  @Get('')
  async getAll(@Query() { archive }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll({ archive });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateDocumentDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      postData,
    });

    return new HttpResponse({
      message: 'Document updated successfully',
      data,
    });
  }

  @Put('/:id/archive')
  async archiveOrRestore(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Document ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Document deleted successfully',
      data,
    });
  }

  @Get('activity')
  async getActivity(@Query() { page, limit }: QueryDto): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      page,
      limit,
      type: 'setting',
    });

    return new HttpResponse({
      ...data,
    });
  }
}
