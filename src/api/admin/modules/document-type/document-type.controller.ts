import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from '../../common/decorators';
import { DocumentTypeService } from './document-type.service';
import { createDocumentTypeDto } from './dtos/create-type.dto';
import {
  updateDocumentTypeDto,
  updateMoveOutDocumentDto,
  updateMultipleDocumentTypeDto,
} from './dtos/update-type.dto';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { addDocumentTypeDto } from './dtos/add-type.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Controller('document_type')
export class DocumentTypeController {
  constructor(
    private readonly service: DocumentTypeService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  async create(
    @Body() postData: createDocumentTypeDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Document Type created successfully',
      data,
    });
  }

  @Put('/moveout')
  async updateMoveOut(
    @Body() postData: updateMoveOutDocumentDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.updateMoveOut({
      id: loggedUserData.apartmentId,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Document Move Out updated successfully',
      data,
    });
  }

  @Put('/add')
  async add(
    @Body() postData: addDocumentTypeDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.add({
      id: loggedUserData.apartmentId,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Document Move Out updated successfully',
      data,
    });
  }

  @Put('all')
  async updateMany(
    @Body() postData: updateMultipleDocumentTypeDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.updateMultiple({
      id: loggedUserData.apartmentId,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Document Type updated successfully',
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateDocumentTypeDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Document Type updated successfully',
      data,
    });
  }

  @Get('activity')
  async getActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: 'documentType',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get()
  async get(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { archive, atSignUp }: QueryDto,
  ) {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      atSignUp,
      archive,
    });
    return new HttpResponse({
      message: 'Document type fetched successfully',
      data,
    });
  }

  @Get('nosignup')
  async getAtSignUp(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { archive }: QueryDto,
  ) {
    const data = await this.service.getAtNoSignUp({
      apartmentId: loggedUserData.apartmentId,
      archive,
    });
    return new HttpResponse({
      message: 'Document type fetched successfully',
      data,
    });
  }

  @Put('/:id/archive')
  async archiveOrRestore(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
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
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Document deleted successfully',
      data,
    });
  }
}
