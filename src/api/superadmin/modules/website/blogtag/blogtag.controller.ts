import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogTagService } from './blogtag.service';
import { ParamId } from 'src/common/decorators';
import { createblogTagDto } from './dtos/create-blogtag.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { updateblogTitleDto } from './dtos/update-blogtag.dto';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('blogtag')
export class BlogTagController {
  constructor(private readonly service: BlogTagService) {}

  @Post()
  async create(
    @Body() body: createblogTagDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.create({
      postData: body,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Tag created successfully',
      data,
    });
  }

  @Get()
  async get(@Query() { page, limit }: QueryDto): Promise<HttpResponse> {
    const { data, docs } = await this.service.getAll({
      page,
      limit,
    });

    return new HttpResponse({
      data,
      docs,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @Body() body: updateblogTitleDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.update({
      id,
      postData: body,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Tag updated successfully',
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Tag deleted successfully',
    });
  }
}
