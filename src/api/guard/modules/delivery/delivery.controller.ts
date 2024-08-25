import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CurrentGuardUser } from '../../common/decorators';
import { createDeliveryDto } from './dtos/create-delivery.dto';
import { HttpResponse } from 'src/common/utils';
import { GuardUser } from '@prisma/client';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ParamId } from 'src/common/decorators';
import { updateParcelDto } from './dtos/update-parcel.dto';
import { QueryDto } from 'src/common/validator/query.validator';
import { createDeliveryTypeDto } from './dtos/create-type.dto';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { checkInQueryDto } from '../checkinout/dto/get-checkinlogs.dto';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'image',
        maxCount: 1,
      },
      {
        name: 'images',
        maxCount: 3,
      },
    ]),
  )
  async create(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createDeliveryDto,
    @UploadedFiles()
    files: { image: Express.Multer.File[]; images: Express.Multer.File[] },
  ) {
    const data = await this.service.create({
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: {
        ...postData,
        image: files.image[0],
      },
    });

    return new HttpResponse({
      message: data.groupEntryId
        ? 'Guest added successfully'
        : 'The resident has been successfully notified',
      data,
    });
  }

  @Get('preapproved')
  async getPreApprovedRides(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getPreapprovedDeliveries({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('waiting')
  async getWaiting(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getWaitingApproval({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Waiting listed below:',
      data,
    });
  }

  @Get('parcel/pending')
  async getPendingParcel(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getParcelPending({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Pending Parcels listed below:',
      data,
    });
  }

  @Get(':id')
  async getById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getById({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('parcel/:id')
  async getParcelById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getParcelById({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('history/parcel')
  async getParcelHistory(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { page, limit, start, end }: checkInQueryDto,
  ) {
    const data = await this.service.getParcelHistory({
      apartmentId: loggedUserData.apartmentId,
      page: String(page),
      limit: String(limit),
      start,
      end,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('parcel/upload/:id')
  @UseInterceptors(FilesInterceptor('file'))
  async updateParcelImage(
    @UploadedFiles(createParseFilePipeBuiler('document'))
    files: Express.Multer.File[],
    @CurrentGuardUser()
    loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.updateParcelImage({
      loggedUserData,
      postData: files,
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      data,
      message: 'The resident has been successfully notified.',
    });
  }

  @Put('parcel/:id')
  async updateParcel(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: updateParcelDto,
    @ParamId() id: string,
  ) {
    const data = await this.service.handoverParcel({
      loggedUserData,
      postData,
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Parcel handover successful',
      data,
    });
  }

  @Post('type')
  async createDeliveryType(
    @Body() postData: createDeliveryTypeDto,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ) {
    const data = await this.service.createDeliveryType({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Delivery type created successfully',
      data,
    });
  }
}
