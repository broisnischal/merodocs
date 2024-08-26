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
import { ServiceUserService } from './serviceuser.service';
import { createServiceUserDto } from './dtos/create-serviceuser.dto';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from '../../../common/decorators';
import { AdminUser } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { updateServiceUserDto } from './dtos/update-serviceuser.dto';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { FileInterceptor } from '@nestjs/platform-express';
import { QueryDto } from '../../../../../common/validator/query.validator';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { dateQueryDto } from 'src/common/dtos/attendance.dto';
import { createUpdateAttendanceDto } from '../guarduser/dtos/create-updateAttendance.dto';

@Controller('serviceuser')
export class ServiceUserController {
  constructor(
    private readonly service: ServiceUserService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  async createV1(
    @Body()
    postData: createServiceUserDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const user = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'User created successfully',
      data: user,
    });
  }

  @Get()
  async getAll(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { archive }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
    });

    return new HttpResponse({
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
      type: 'serviceuser',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('attendance')
  async getAllsAttendance(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { start, type, end, date }: dateQueryDto,
  ) {
    const data = await this.service.getAllAttendance({
      apartmentId: loggedUserData.apartmentId,
      start,
      type,
      end,
      date,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('attendance/activity')
  async getAttendanceActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: ['service-attendance', 'guard-attendance', 'service-attendance'],
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get(':id')
  async getSingle(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get(':id/attendance')
  async getSingleAttendance(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
    @Query() { date, start, type, end }: dateQueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingleAttendance({
      id,
      apartmentId: loggedUserData.apartmentId,
      date,
      start,
      type,
      end,
    });

    return new HttpResponse({
      data,
    });
  }

  @Post('attendance')
  async createOrUpdateAttendance(
    @Body() postData: createUpdateAttendanceDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    await this.service.createOrUpdateAttendance({
      postData,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Attendance created successfully',
    });
  }

  @Put(':id')
  async update(
    @Body() postData: updateServiceUserDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      apartmentId: loggedUserData.apartmentId,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'User updated successfully',
      data,
    });
  }

  @Put(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.upload({
      apartmentId: loggedUserData.apartmentId,
      id: id,
      loggedUserData,
      postData: file,
    });
    return new HttpResponse({
      message: 'Image uploaded successfully',
      data,
    });
  }

  @Put(':id/archive')
  async archiveOrRestore(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `User ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({
      id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
    });

    return new HttpResponse({
      message: `User deleted successfully`,
      data,
    });
  }
}
