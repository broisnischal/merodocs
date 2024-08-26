import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PopupbannerService } from './popupbanner.service';
import { HttpResponse } from 'src/common/utils';
import { createBannerDto } from './dtos/create-banner.dto';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { SuperAdmin } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ParamId } from 'src/common/decorators';
import { updateBannerDto } from './dtos/update-banner.dto';
import { QueryDto } from 'src/common/validator/query.validator';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import { assignBannerDto } from './dtos/assign-banner.dto';
import { unassignBannerDto } from './dtos/unassign-banner.dto';

@Controller('popupbanner')
export class PopupBannerController {
  constructor(
    private readonly service: PopupbannerService,
    private readonly activityService: SuperAdminActivityService,
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'web', maxCount: 1 },
      { name: 'mob', maxCount: 1 },
    ]),
  )
  async createPopupBanner(
    @Body() postData: createBannerDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFiles()
    files: { web: Express.Multer.File[]; mob: Express.Multer.File[] },
  ): Promise<HttpResponse> {
    if (!files.web || !files.mob)
      throw new BadRequestException(
        'Please provide both web and mobile images',
      );

    if (files.web.length !== 1 || files.mob.length !== 1)
      throw new BadRequestException(
        'Please provide only one image for web and mobile',
      );

    const data = await this.service.createPopupBanner({
      postData: { ...postData, web: files.web[0], mob: files.mob[0] },
      loggedUserData,
    });
    return new HttpResponse({
      message: 'Popup Banner created successfully',
      data,
    });
  }

  @Post('assign/:id')
  async assignPopupBanner(
    @ParamId() id: string,
    @Body() postData: assignBannerDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.assignBannerToApartment({
      id,
      postData,
      loggedUserData,
    });
    return new HttpResponse({
      message: 'Popup Banner assigned successfully',
      data,
    });
  }

  @Post('assign-all/:id')
  async assignPopupBannerAll(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.assignBannerToAllApartments({
      id,
      postData: undefined,
      loggedUserData,
    });
    return new HttpResponse({
      message: 'Popup Banner assigned for all apartments successfully',
      data,
    });
  }

  @Put('unassign/:id')
  async unassignPopupBanner(
    @ParamId() id: string,
    @Body() postData: unassignBannerDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.unassignBannerFromApartment({
      id,
      postData,
      loggedUserData,
    });
    return new HttpResponse({
      message: 'Popup Banner unassigned successfully',
      data,
    });
  }

  @Get()
  async getAllPopupBanner(): Promise<HttpResponse> {
    const data = await this.service.getAllPopupBanner();
    return new HttpResponse({
      data,
    });
  }
  @Get('activity')
  async getActivity(@Query() { page, limit }: QueryDto): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      page,
      limit,
      type: 'popupbanner',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('activated')
  async getActivatedPopupBanner(): Promise<HttpResponse> {
    const data = await this.service.getActivatedPopupBanner();
    return new HttpResponse({
      data,
    });
  }

  @Put('/enable')
  async enablePopupBanner(
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.enablePopupBanner({
      id: loggedUserData.id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Popup Banner ${data.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  }

  @Put('/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'web', maxCount: 1 },
      { name: 'mob', maxCount: 1 },
    ]),
  )
  async updatePopupBanner(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFiles()
    files: { web?: Express.Multer.File[]; mob?: Express.Multer.File[] },
    @Body() postData: updateBannerDto,
  ): Promise<HttpResponse> {
    const data = await this.service.updatePopupBanner({
      id,
      loggedUserData,
      postData: {
        ...postData,
        web: files?.web?.length === 1 ? files.web[0] : undefined,
        mob: files?.mob?.length === 1 ? files.mob[0] : undefined,
      },
    });

    return new HttpResponse({
      message: 'Popup Banner updated successfully',
      data,
    });
  }

  @Delete('/:id')
  async deletePopupBanner(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.deletePopupBanner({
      id,
      loggedUserData,
    });
    return new HttpResponse({
      message: 'Popup Banner deleted successfully',
      data,
    });
  }
}
