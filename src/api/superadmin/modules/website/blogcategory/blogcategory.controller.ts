import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogCategoryService } from './blogcategory.service';
import { ParamId } from 'src/common/decorators';
import { createblogCategoryDto } from './dtos/create-blogcategory.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { updateblogCategoryDto } from './dtos/update-blogcategory.dto';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('blogcategory')
export class BlogCategoryController {
  constructor(private readonly service: BlogCategoryService) {}

  @Post()
  async create(
    @Body() body: createblogCategoryDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    await this.service.create({
      postData: body,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Category created successfully',
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
    @Body() body: updateblogCategoryDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.update({
      id,
      postData: body,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Category updated successfully',
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
      message: 'Category deleted successfully',
    });
  }
}
