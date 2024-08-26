import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { createVechileDto, vehicleEntryDto } from './dtos';
import { HttpResponse } from 'src/common/utils';
import { GuardUser } from '@prisma/client';
import { CurrentGuardUser } from '../../common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  @Post('type')
  async create(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createVechileDto,
  ) {
    const data = await this.service.createVehicleType({
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData,
    });

    return new HttpResponse({
      message: 'Vehicle created successfully',
      data,
    });
  }

  @Get('type')
  async get(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getVehicleType({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Vehicle listed below',
      data,
    });
  }

  @Post('entry')
  @UseInterceptors(FileInterceptor('image'))
  async createEntry(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: vehicleEntryDto,
    @UploadedFile(createParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ) {
    const data = await this.service.createVehicleEntry({
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: {
        ...postData,
        image,
      },
    });

    return new HttpResponse({
      message: 'Entry Recorded',
      data,
    });
  }

  @Post('frequent/:id')
  async createFrequentEntry(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.createFrequentVehicleEntry({
      id,
      postData: undefined,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Entry Recorded',
      data,
    });
  }

  @Get('frequent')
  async getVehicleEntry(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getVehicleFrequent({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Frequent Vehicle listed below',
      data,
    });
  }

  @Delete(':id')
  async delete(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.delete({
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      id,
    });

    return new HttpResponse({
      message: 'Vehicle removed successfully',
      data,
    });
  }
}
