import {
  Body,
  Controller,
  Put,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { updateApartmentDto } from './dtos/update-apartment.dto';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { AdminUser } from '@prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { ParamId } from 'src/common/decorators';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('apartment')
export class ApartmentController {
  constructor(
    private readonly service: ApartmentService,
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Put()
  async update(
    @Body() postData: updateApartmentDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    // When user is logged in for the first time and editing the apartment details after the login page
    if (loggedUserData.firstLoggedIn) {
      await this.prisma.adminUser.update({
        where: {
          id: loggedUserData.id,
        },
        data: {
          firstLoggedIn: false,
        },
      });
    }

    return new HttpResponse({
      message: 'Apartment updated successfully',
      data,
    });
  }

  @Get()
  async get(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.get({
      id: loggedUserData.apartmentId,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('activity')
  async getActivityAll(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: 'apartment',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('activity/:id')
  async getActivity(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const block = await this.prisma.block.findFirst({
      where: { id },
    });

    if (!block) throw new NotFoundException('Block doesnot exist');

    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      blockId: id,
      page,
      limit,
      type: 'floorandflat',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('alllist')
  async getAllList(@AdminLoggedUser() loggedUserData: AdminUser) {
    const data = await this.service.getAllList({
      apartmentId: loggedUserData.apartmentId,
      id: loggedUserData.id,
    });

    return new HttpResponse({
      data: data,
    });
  }
}
