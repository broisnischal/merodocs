import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { FAQService } from './faq.service';
import { ParamId } from 'src/common/decorators';
import { createFAQDto } from './dtos/create-faq.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { updateFAQDto } from './dtos/update-faq.dto';
import { getFAQsDto } from './dtos/get-faqs.dto';

@Controller('faqs')
export class FAQController {
  constructor(private readonly service: FAQService) {}

  @Post()
  async create(
    @Body() body: createFAQDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    await this.service.create({
      postData: body,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'FAQ created successfully',
    });
  }

  @Get(':for')
  async get(@Param() { for: forType }: getFAQsDto) {
    const faqs = await this.service.get({
      forType,
    });

    return new HttpResponse({
      data: faqs,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @Body() body: updateFAQDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    await this.service.update({
      id,
      postData: body,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'FAQ updated successfully',
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
      message: 'FAQ deleted successfully',
    });
  }
}
