import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CurrentGuardUser } from '../../common/decorators';
import { createServiceDto, createServiceTypeDto } from './dtos/index.dto';
import { HttpResponse } from 'src/common/utils';
import { GuardUser } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('service')
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createServiceDto,
    @UploadedFile(createParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ) {
    const data = await this.service.create({
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: {
        ...postData,
        image,
      },
    });

    return new HttpResponse({
      message: 'The resident has been successfully notified',
      data,
    });
  }

  @Get('preapproved')
  async getPreapproved(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getPreapproved({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Preapproved visitors are listed below:',
      data,
    });
  }

  @Get('preapproved/:id')
  async getPreapprovedId(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getPreapprovedId({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Preapproved visitors is listed below:',
      data,
    });
  }

  @Post('type')
  async createDeliveryType(
    @Body() postData: createServiceTypeDto,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ) {
    const data = await this.service.createServiceType({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Service type created successfully',
      data,
    });
  }
}
