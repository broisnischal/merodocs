import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { VehicleService } from './vehicle.service';
import { ParamId } from 'src/common/decorators';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get('')
  async getVehicles(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.vehicleService.getAllVehicles({
      user,
    });
    return new HttpResponse({
      message: 'Vehicles fetched',
      data,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createVehicle(
    @FlatClientUser() user: FlatClientUserAuth,
    @Body() body: CreateVehicleDto,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const vehicle = await this.vehicleService.createVehicle({
      body: {
        ...body,
        file,
      },
      user,
    });

    return new HttpResponse({
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateVehicle(
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @ParamId()
    id: string,
    @Body() body: UpdateVehicleDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const vehicle = await this.vehicleService.updateVehicle({
      body: {
        ...body,
        file,
      },
      id,
      user,
    });
    return new HttpResponse({
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const vehicle = await this.vehicleService.upload({
      id,
      user,
      body: file,
    });
    return new HttpResponse({
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  }

  @Delete(':id')
  async deleteVehicle(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    await this.vehicleService.deleteVehicle({
      id,
      user,
    });
    return new HttpResponse({
      message: 'Vehicle deleted successfully',
    });
  }
}
