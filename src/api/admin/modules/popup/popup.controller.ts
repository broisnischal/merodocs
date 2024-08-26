import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PopUpService } from './popup.service';
import { createPopupDto } from './dtos/create-popup.dto';
import { HttpResponse } from 'src/common/utils';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from '../../common/decorators';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParamId } from 'src/common/decorators';
import { updatePopupDto } from './dtos/update-popup.dto';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Controller('popup')
export class PopUpController {
  constructor(
    private readonly service: PopUpService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post('')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() postData: createPopupDto,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ) {
    const data = await this.service.create({
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: {
        ...postData,
        image,
      },
    });

    return new HttpResponse({
      message: 'Popup created successfully',
      data,
    });
  }

  @Get('own')
  async getOwnPopupBanner(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getOwnPopupBanner({
      apartmentId: loggedUserData.apartmentId,
    });
    return new HttpResponse({
      message: 'Popup listed below:',
      data,
    });
  }

  @Get('activity')
  async getActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: 'popup',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get()
  async getAllPopupBanner(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllPopupBanner(loggedUserData);
    return new HttpResponse({
      message: 'Popup listed below:',
      data,
    });
  }

  @Get('activated')
  async getActivatedPopupBanner(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getActivatedPopupBanner(loggedUserData);
    return new HttpResponse({
      data,
    });
  }

  @Put('/:id/activate')
  async activatePopupBanner(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.activatePopupBanner({
      id,
      loggedUserData,
      postData: undefined,
      apartmentId: loggedUserData.apartmentId,
    });
    return new HttpResponse({
      message: `Popup Banner ${data.activated ? 'activated' : 'deactivated'} successfully`,
    });
  }

  @Put('/enable')
  async enablePopupBanner(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.enablePopupBanner({
      id: loggedUserData.id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Popup Banner ${data.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  }

  @Put('/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updatePopupBanner(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() postData: updatePopupDto,

    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    image: Express.Multer.File,
  ): Promise<HttpResponse> {
    const data = await this.service.updatePopupBanner({
      id,
      loggedUserData,
      postData: {
        ...postData,
        image,
      },
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Popup Banner updated successfully',
      data,
    });
  }

  @Delete('/:id')
  async deletePopupBanner(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.deletePopupBanner({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });
    return new HttpResponse({
      message: 'Popup Banner deleted successfully',
      data,
    });
  }
}
