import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CheckInOutService } from './checkinout.service';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { CurrentGuardUser } from '../../common/decorators';
import { GuardUser } from '@prisma/client';
import { createCheckInDto } from './dto/create-checkIn.dto';
import { HttpResponse } from 'src/common/utils';
import { checkInCodeDto } from './dto/checkin-code.dto';
import { createCheckInCodeDto } from './dto/create-checkIn-code.dto';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { checkInQueryDto } from './dto/get-checkinlogs.dto';
import { checkOutVisitorsDto } from './dto/checkout-visitors.dto';
import { ParamId } from 'src/common/decorators';
import { UpdateCheckInDto } from './dto/update-checkin.dto';
import { capitalize } from 'lodash';

@Controller('checkinout')
export class CheckInOutController {
  constructor(private readonly service: CheckInOutService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      {
        name: 'images',
        maxCount: 3,
      },
    ]),
  )
  async createCheckIn(
    @UploadedFiles() // TODO: Add File Validator
    files: {
      image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createCheckInDto,
  ) {
    if (files.image?.length !== 1)
      throw new BadRequestException('Image is required');

    // if (!files.images)
    //   throw new BadRequestException('At least one image is required');

    // if (files.images.length < 1)
    //   throw new BadRequestException('At least one image is required');

    const data = await this.service.createCheckInOutForPreApproved({
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: {
        ...postData,
        image: files.image[0],
        images: files.images,
      },
    });

    return new HttpResponse({
      message: `${capitalize(data?.requestType ? data.requestType + ' ' : '')}Entry Recorded`,
      data,
    });
  }

  @Post('list')
  async checkIn(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: checkInCodeDto,
  ) {
    const data = await this.service.getCheckInByCode({
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Data is listed below',
      data,
    });
  }

  @Post('code')
  @UseInterceptors(FileInterceptor('image'))
  async createCheckInByCode(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: createCheckInCodeDto,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    image?: Express.Multer.File,
  ) {
    const data = await this.service.createCheckInOutByCode({
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: {
        ...postData,
        image,
      },
    });

    const messages = {
      client: 'Resident Entry Recorded',
      clientstaff: 'Client Staff Entry Recorded',
      adminservice: 'Society Staff Entry Recorded',
    };

    return new HttpResponse({
      message: messages[data.requestType] || 'Entry Recorded',
      data,
    });
  }

  @Get('logs')
  async getAllVisitorLogs(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { requestType, page, limit, start, end }: checkInQueryDto,
  ) {
    const data = await this.service.getAllVisitorLogs({
      apartmentId: loggedUserData.apartmentId,
      extended: {
        requestType,
        page,
        limit,
        start,
        end,
      },
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Post('checkout')
  async checkOut(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Body() postData: checkOutVisitorsDto,
  ) {
    const data = await this.service.createCheckOut({
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    const messages = {
      client: 'Resident Exit Recorded',
      clientstaff: 'Client Staff Exit Recorded',
      adminservice: 'Society Staff Exit Recorded',
    };

    return new HttpResponse({
      message: messages[data.requestType] || 'Exit Recorded',
      data,
    });
  }

  @Get('/waiting')
  async getWaitingList(
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getWaitingApproval({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Checkinout details:',
      data,
    });
  }

  @Get('/:id')
  async getApprovalList(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.getWaitingApprovalByType({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Checkinout details:',
      data,
    });
  }

  @Post('/resend-notification/:id')
  async resendNotification(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.resendNotificationToClient({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Notification sent successfully',
      data,
    });
  }

  @Post('/force-update/:id')
  async forceApproval(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
    @Body() postData: UpdateCheckInDto,
  ): Promise<HttpResponse> {
    await this.service.forceApproveCheckIn({
      apartmentId: loggedUserData.apartmentId,
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Request ${postData.status} successfully`,
    });
  }

  @Post('/entry/:id')
  async entry(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.createEntry({
      apartmentId: loggedUserData.apartmentId,
      id,
      postData: undefined,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Check In Successfull`,
    });
  }

  @Post('/deny/:id')
  async deny(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.deniedEntry({
      apartmentId: loggedUserData.apartmentId,
      id,
      postData: undefined,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Denied Successfull`,
    });
  }
}
