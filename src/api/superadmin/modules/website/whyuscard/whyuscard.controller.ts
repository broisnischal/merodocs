import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { WhyUsCardService } from './whyuscard.service';
import { ParamId } from 'src/common/decorators';
import { createWhyUsCardDto } from './dtos/create-whyuscard.dto';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { updateWhyUsCardDto } from './dtos/update-whyuscard.dto';
import { SuperAdminUser } from '../../../common/decorators';

@Controller('whyus-card')
export class WhyUsCardController {
  constructor(private readonly service: WhyUsCardService) {}

  @Post(':id')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @ParamId() id: string,
    @Body() body: createWhyUsCardDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createParseFilePipeBuiler('image')) file: Express.Multer.File,
  ) {
    const data = await this.service.create({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Why us card created successfully',
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @ParamId() id: string,
    @Body() body: updateWhyUsCardDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const data = await this.service.update({
      id,
      postData: { ...body, file },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Why us card updated successfully',
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ) {
    const data = await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Why us card deleted successfully',
      data,
    });
  }
}
