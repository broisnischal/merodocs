import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApartmentClientUserService } from './apartmentclientuser.service';
import { ApartmentRequestDto } from '../dtos/query.validator';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';
import { updateRequestDto } from './dto/update-request.dto';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Controller('apartmentclientuser')
export class ApartmentClientUserController {
  constructor(
    private readonly service: ApartmentClientUserService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Get('analysis')
  async getAnalysis(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAnalysisData({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get()
  async getAllAccountRequests(
    @Query() { status, type }: ApartmentRequestDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllAccountRequests({
      status,
      type,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('moveout')
  async getMoveOutRequests(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { status }: ApartmentRequestDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllMoveOutRequest({
      apartmentId: loggedUserData.apartmentId,
      status,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('activity')
  async getAttendanceActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit, approvalType }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: approvalType ? approvalType : 'moveIn',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('become-owner')
  async getBecomeOwnerRequest(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { status }: ApartmentRequestDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllBecomeOwnerRequest({
      apartmentId: loggedUserData.apartmentId,
      status,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() postData: updateRequestDto,
  ): Promise<HttpResponse> {
    await this.service.update({
      id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData: loggedUserData,
      postData,
    });

    return new HttpResponse({
      message: 'Request updated successfully',
    });
  }

  @Get('staffaccount')
  async getAllStaffAccountRequests(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { status }: ApartmentRequestDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllStaffAccountRequest({
      apartmentId: loggedUserData.apartmentId,
      status,
    });
    return new HttpResponse({
      data,
    });
  }

  @Put('staffaccount/:id')
  async updateStaffAccountRequests(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() postData: updateRequestDto,
  ): Promise<HttpResponse> {
    await this.service.updateStaffAccountRequest({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });

    return new HttpResponse({
      message: 'Request updated successfully',
    });
  }
}
