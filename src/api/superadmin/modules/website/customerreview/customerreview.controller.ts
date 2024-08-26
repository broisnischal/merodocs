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
import { CustomerReviewService } from './customerreview.service';
import { createCustomerReviewDto } from './dtos/create-customerreview.dto';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { SuperAdmin } from '@prisma/client';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';
import { updateCustomerReviewDto } from './dtos/update-customerreview.dto';

@Controller('customerreview')
export class CustomerReviewController {
  constructor(private readonly service: CustomerReviewService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() postData: createCustomerReviewDto,
    @UploadedFile(createParseFilePipeBuiler('image')) file: Express.Multer.File,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.create({
      postData: {
        ...postData,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Review successfully created',
    });
  }

  @Get()
  async get(@Query() { filter }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll({
      filter,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @ParamId() id: string,
    @Body() postData: updateCustomerReviewDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file?: Express.Multer.File,
  ): Promise<HttpResponse> {
    await this.service.update({
      id,
      postData: {
        ...postData,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Review updated successfully',
    });
  }

  @Put(':id/feature')
  async featureOrUnfeature(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.featureOrUnfeatured({
      id,
      postData: undefined,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Review ${data.featured ? 'featured' : 'unfeatured'} successfully`,
    });
  }

  @Put(':id/archive')
  async archiveOrUnarchive(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrUnarchive({
      id,
      postData: undefined,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Review ${data.archive ? 'archived' : 'restored'} successfully`,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Review deleted successfully',
    });
  }
}
