import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GuardUser } from '@prisma/client';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import { CurrentGuardUser } from '../../common/decorators';
import { CreateGroupDto } from './dtos';
import { ParamId } from 'src/common/decorators';
import { createMultipleGroupDto } from './dtos/multiplegroup.dto';

@Controller('group')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('image'))
  async createGroup(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: CreateGroupDto,
    @UploadedFile(createParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ) {
    const data = await this.service.createGroup({
      postData: {
        ...postData,
        image,
      },
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Entry Recorded',
      data,
    });
  }

  @Post('multiple')
  @UseInterceptors(FileInterceptor('image'))
  async createMultipleGroup(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createMultipleGroupDto,
  ) {
    const data = await this.service.createMultipleGroup({
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Entry Recorded',
      data,
    });
  }

  @Get('/:id')
  async getPending(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Param('id') id: string,
  ) {
    const data = await this.service.getPending({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Created are listed below:',
      data,
    });
  }

  @Delete('/:id')
  async delete(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.deleteGroup({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Group deleted successfully:',
      data,
    });
  }
}
