import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { HttpResponse } from 'src/common/utils';
import { MemberService } from './member.service';
import {
  createMemberOnlineDto,
  createMemberOfflineDto,
  updateMemberOfflineDto,
  verifyMemberOnlineDto,
} from './dtos/member.dto';
import { FlatClientUser } from '../../common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';
import { signUpClientUserDto } from '../auth/dtos/auth.dto';

@Controller('member')
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Post('contact')
  async createOnlineNumber(
    @Body() body: signUpClientUserDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.createContactOnline({
      user,
      body,
    });

    return new HttpResponse({
      message: 'Number created successfully',
      data,
    });
  }

  @Post('contact/verify')
  async verifyOnlineNumber(
    @Body() body: verifyMemberOnlineDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.verifyContactOnline({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Number created successfully',
      data: data as any,
    });
  }
  @Post('online')
  async createOnline(
    @Body() body: createMemberOnlineDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.createOnlineMember({
      user,
      body,
    });

    return new HttpResponse({
      message: 'Member created successfully',
      data,
    });
  }

  @Post('offline')
  @UseInterceptors(FileInterceptor('file'))
  async createOffline(
    @Body() body: createMemberOfflineDto,
    @FlatClientUser() user: FlatClientUserAuth,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ): Promise<HttpResponse> {
    const data = await this.service.createOffline({
      user,
      body: {
        ...body,
        file,
      },
    });

    return new HttpResponse({
      message: 'Member created successfully',
      data,
    });
  }

  @Put('offline/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateOfflineUser(
    @Body() body: updateMemberOfflineDto,
    @FlatClientUser() user: FlatClientUserAuth,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @Param() { id },
  ): Promise<HttpResponse> {
    const data = await this.service.updateOffline({
      id,
      user,
      body: {
        ...body,
        file,
      },
    });

    return new HttpResponse({
      message: 'Member updated successfully',
      data,
    });
  }

  @Get('online')
  async getOnline(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getOnline({
      user,
    });

    return new HttpResponse({
      message: 'Online members retrieved successfully',
      data,
    });
  }

  @Get('offline')
  async getOffline(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getOffline({
      user,
    });

    return new HttpResponse({
      message: 'Offline members retrieved successfully',
      data,
    });
  }

  @Get(':id')
  async getById(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.getById({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Offline members retrieved successfully',
      data,
    });
  }

  @Delete(':id')
  async delete(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Member deleted successfully',
    });
  }
}
