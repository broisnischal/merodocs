import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { GuestService } from './guest.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GuardUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { CurrentGuardUser } from '../../common/decorators';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { createGuestDto, entryGuestMassDto } from './dtos/index.dto';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { createMultipleGuestNotificationDto } from './dtos/create-guestnotification';

@Controller('guest')
export class GuestController {
  constructor(private readonly service: GuestService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createGuestDto,
    @UploadedFile(createParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ) {
    const data = await this.service.create({
      postData: {
        ...postData,
        image,
      },
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'The resident has been successfully notified',
      data,
    });
  }

  @Get('pending/:id')
  async getPending(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Param('id') id: string,
  ) {
    const data = await this.service.getPending({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Pending approval are listed below:',
      data,
    });
  }

  @Post('notification')
  async send(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createMultipleGuestNotificationDto,
  ) {
    const data = await this.service.createNotification({
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
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

  @Get('waiting/:id')
  async getWaiting(
    @Param('id') id: string,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ) {
    const data = await this.service.getPendingApproval({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Pending approval are listed below:',
      data,
    });
  }

  @Delete('/:id')
  async delete(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.deleteGuest({
      apartmentId: loggedUserData.apartmentId,
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Guest deleted successfully:',
      data,
    });
  }

  @Get('mass')
  async getMass(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getMassEvent({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Mass guests are listed below:',
      data,
    });
  }

  @Get('mass/:id')
  async getMassById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
    @Query() { number }: QueryDto,
  ) {
    const data = await this.service.getMassEventById({
      apartmentId: loggedUserData.apartmentId,
      id,
      number,
    });

    return new HttpResponse({
      message: 'Mass guests are listed below:',
      data,
    });
  }

  @Get('history/mass')
  async getHistoryMass(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { date }: QueryDto,
  ) {
    const data = await this.service.getMassHistory({
      apartmentId: loggedUserData.apartmentId,
      date,
    });

    return new HttpResponse({
      message: 'Mass guests are listed below:',
      data,
    });
  }

  @Get('details/:id')
  async getDetailsById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getMassHistoryById({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Details are listed below:',
      data,
    });
  }

  @Get(':id')
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

  @Put('mass/:id')
  async createMass(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: entryGuestMassDto,
    @ParamId() id: string,
  ) {
    const data = await this.service.entryMass({
      id,
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Entry Recorded',
      data,
    });
  }

  // @Put('multiple')
  // @UseInterceptors(FilesInterceptor('images'))
  // async upload(
  //   @UploadedFiles(createParseFilePipeBuiler('image'))
  //   images: Express.Multer.File[],
  //   @CurrentGuardUser()
  //   loggedUserData: GuardUser,
  //   @Body() postData: updateMultipleGuestDto,
  // ) {
  //   const data = await this.service.uploadMultiple({
  //     id: '',
  //     postData: {
  //       ...postData,
  //       images,
  //     },
  //     apartmentId: loggedUserData.apartmentId,
  //     loggedUserData,
  //   });

  //   return new HttpResponse({
  //     message: 'Guest created successfully',
  //     data,
  //   });
  // }

  // @Post('multiple')
  // async createMany(
  //   @CurrentGuardUser() loggedUserData: GuardUser,
  //   @Body() postData: createMultipleGuestDto,
  // ) {
  //   const data = await this.service.createMultiple({
  //     postData,
  //     apartmentId: loggedUserData.apartmentId,
  //     loggedUserData,
  //   });

  //   return new HttpResponse({
  //     message: 'Guest created successfully',
  //     data,
  //   });
  // }
}
