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
import { CreatePetDto, UpdatePetDto } from './dto/pets.dto';
import { PetService } from './pets.service';
import { ParamId } from 'src/common/decorators';

@Controller('pet')
export class PetController {
  constructor(private readonly service: PetService) {}

  @Get('')
  async getPet(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getAll({
      user,
    });
    return new HttpResponse({
      message: 'Pets fetched successfully!',
      data,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createPet(
    @FlatClientUser() user: FlatClientUserAuth,
    @Body() body: CreatePetDto,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const pets = await this.service.create({
      body,
      user,
      extend: {
        file,
      },
    });
    return new HttpResponse({
      message: 'You have added a pet for your flat',
      data: pets,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updatePet(
    @ParamId() id: string,
    @Body() body: UpdatePetDto,
    @FlatClientUser() user: FlatClientUserAuth,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const pet = await this.service.update({
      body,
      id,
      user,
      extend: {
        file,
      },
    });

    return new HttpResponse({
      message: 'Pet updated successfully',
      data: pet,
    });
  }

  @Delete(':id')
  async deletePet(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    await this.service.delete({
      id,
      user,
    });
    return new HttpResponse({
      message: 'Pet deleted successfully',
    });
  }
}
