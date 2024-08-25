import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import {
  StaffQueryDto,
  createClientStaffDto,
  updateClientStaffDto,
} from './dto/staff.dto';
import { StaffService } from './staff.service';
import { ParamId } from 'src/common/decorators';
import { dateQueryDto } from 'src/common/dtos/attendance.dto';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('staff')
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Get('roles')
  async getStaffsRoles(@Query('q') q: string): Promise<HttpResponse> {
    const data = await this.service.getStaffRoles(q || '');

    return new HttpResponse({
      message: 'Staff roles fetched successfully',
      data,
    });
  }

  @Get('logs')
  async getStaffLogs(
    @FlatClientUser() user: FlatClientUserAuth,
    @Query() { page, limit, startDate, endDate }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getStaffLogs({
      user,
      page,
      limit,
      startDate,
      endDate,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get()
  async getStaffs(
    @Query() { status, q }: StaffQueryDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    if (q) {
      const data = await this.service.search({
        q,
        user,
      });

      return new HttpResponse({
        message: 'Staffs fetched successfully! ',
        data,
      });
    } else {
      const data = await this.service.getStaffs({
        user,
        extend: {
          type: status,
        },
      });

      return new HttpResponse({
        message: 'Staffs fetched successfully',
        data,
      });
    }
  }

  @Get('/:id')
  async getStaffID(
    @Param('id') id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getId({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Staffs fetched successfully',
      data,
    });
  }

  @Get('add-staff/:id')
  async addStaffToFlat(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const res = await this.service.addStaffToFlat({
      id,
      user,
      body: undefined,
    });

    return new HttpResponse({
      message: 'Staff added to flat successfully',
      data: res,
    });
  }

  @Get('remove-staff/:id')
  async removeStaffFromFlat(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    await this.service.removeStaffFromFlat({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Staff removed from flat successfully',
    });
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profile', maxCount: 1 },
      { name: 'citizenshipFrontImage', maxCount: 1 },
      { name: 'citizenshipBackImage', maxCount: 1 },
    ]),
  )
  async createStaff(
    @UploadedFiles(new ParseFilePipe({}))
    files: {
      profile: Express.Multer.File[];
      citizenshipFrontImage: Express.Multer.File[];
      citizenshipBackImage: Express.Multer.File[];
    },
    @Body() body: createClientStaffDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const profile = files.profile && files.profile[0];
    const citizenshipFrontImage =
      files.citizenshipFrontImage && files.citizenshipFrontImage[0];
    const citizenshipBackImage =
      files.citizenshipBackImage && files.citizenshipBackImage[0];

    const data = await this.service.registerStaff({
      body: {
        ...body,
        citizenshipFrontImage,
        citizenshipBackImage,
        profile,
      },
      user,
    });

    return new HttpResponse({
      message:
        'An account for a personal staff is successfully created and he will be added once accepted by an admin',
      data,
    });
  }

  @Delete(':id')
  async cancelRequest(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.cancelRequest({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Request cancelled successfully',
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profile', maxCount: 1 },
      { name: 'citizenshipFrontImage', maxCount: 1 },
      { name: 'citizenshipBackImage', maxCount: 1 },
    ]),
  )
  async updateStaff(
    @UploadedFiles()
    files: {
      profile: Express.Multer.File[];
      citizenshipFrontImage: Express.Multer.File[];
      citizenshipBackImage: Express.Multer.File[];
    },
    @Body() body: updateClientStaffDto,
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const profile = files.profile && files.profile[0];
    const citizenshipFrontImage =
      files.citizenshipFrontImage && files.citizenshipFrontImage[0];
    const citizenshipBackImage =
      files.citizenshipBackImage && files.citizenshipBackImage[0];

    const data = await this.service.updateStaff({
      id,
      body: {
        ...body,
        citizenshipFrontImage,
        citizenshipBackImage,
        profile,
      },
      user,
    });

    return new HttpResponse({
      message: 'Staff updated successfully',
      data,
    });
  }

  @Get(':id/attendance')
  async getSingleAttendance(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
    @Query() { date, start, type, end }: dateQueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAttendance({
      id,
      user,
      date,
      start,
      type,
      end,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get(':id/date')
  async getAttendanceByDate(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
    @Query() { date }: QueryDto,
  ): Promise<HttpResponse> {
    if (!date) throw new BadRequestException('Date is required');
    const data = await this.service.getAttendanceByDate({
      id,
      user,
      date,
    });

    return new HttpResponse({
      data,
    });
  }
}
