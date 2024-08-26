import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RideService } from './ride.service';
import { CurrentGuardUser } from '../../common/decorators';
import { createRideDto } from './dtos/create-ride.dto';
import { HttpResponse } from 'src/common/utils';
import { GuardUser } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { createRideTypeDto } from './dtos/index.dto';

@Controller('ride')
export class RideController {
  constructor(private readonly service: RideService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createRideDto,
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
  async getPreApprovedRides(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getPreapprovedRides({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
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

  @Post('type')
  async createRideType(
    @Body() postData: createRideTypeDto,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ) {
    const data = await this.service.createRideType({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Ride type created successfully',
      data,
    });
  }
}
