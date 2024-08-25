import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { HttpResponse } from 'src/common/utils';
import { createBlockDto, updateBlockDto } from './dtos';
import { ParamId, Private } from 'src/common/decorators';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { AdminUser } from '@prisma/client';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('block')
export class BlockController {
  constructor(private readonly service: BlockService) {}

  @Post()
  async create(
    @Body() postData: createBlockDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Block created successfully',
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateBlockDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Block updated successfully',
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
      message: `Block ${data.archive ? 'restored' : 'archived'} successfully`,
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
      message: 'Block deleted successfully',
      data,
    });
  }

  @Private()
  @Get()
  async getAll(
    @AdminLoggedUser()
    loggedUserData: AdminUser,
    @Query() { archive }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Private()
  @Get('floors')
  async getAllFloors(
    @Query() { ids }: QueryDto,
    @AdminLoggedUser()
    loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getMultiple({
      apartmentId: loggedUserData.apartmentId,
      ids,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('/:id')
  async getSingle(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
