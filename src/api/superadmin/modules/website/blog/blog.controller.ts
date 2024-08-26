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
import { BlogService } from './blog.service';
import { ParamId } from 'src/common/decorators';
import { createBlogDto } from './dtos/create-blog.dto';
import { updateBlogDto } from './dtos/update-blog.dto';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('blog')
export class BlogController {
  constructor(private readonly service: BlogService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  async create(
    @Body() body: createBlogDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const blog = await this.service.create({
      postData: {
        ...body,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Blog created successfully',
      data: blog,
    });
  }

  @Get()
  async get(@Query() { archive, filter, featured, page, limit, q }: QueryDto) {
    const blogs = await this.service.get({
      page,
      limit,
      filter,
      featured,
      archive,
      q,
    });

    return new HttpResponse({
      data: blogs,
    });
  }

  @Get(':id')
  async getSingle(@ParamId() id: string) {
    const blogs = await this.service.getSingle({
      id,
    });

    return new HttpResponse({
      data: blogs,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('cover'))
  async update(
    @ParamId() id: string,
    @Body() body: updateBlogDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file?: Express.Multer.File,
  ) {
    const data = await this.service.update({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Blog updated successfully',
      data,
    });
  }

  @Delete('image')
  async deleteImage(@Query('url') url: string) {
    await this.service.deleteImage({
      url,
    });

    return new HttpResponse({
      message: 'Image deleted successfully',
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    await this.service.deleteBlog({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Blog deleted successfully',
    });
  }

  @Put(':id/feature')
  async featureBlog(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.featureBlog({
      id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Blog ${data.featured ? 'featured' : 'unfeatured'} successfully`,
      data,
    });
  }

  @Put(':id/archive')
  async archive(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.archive({
      id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Blog ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Put(':id/publish')
  async publishBlog(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.publishBlog({
      id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: 'Blog published successfully',
      data,
    });
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async upload(
    @UploadedFile(createParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ) {
    const blog = await this.service.uploadImage({
      postData: { image },
    });

    return new HttpResponse({
      message: 'Image created successfully',
      data: blog,
    });
  }
}
