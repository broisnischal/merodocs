import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Private, Public } from 'src/common/decorators';
import { ProfileService } from './profile.service';
import { HttpResponse } from 'src/common/utils';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { updateProfileDto } from './dto/update-profile.dto';
import { SuperAdmin } from '@prisma/client';
import { SuperAdminUser } from '../../common/decorators';
import { updatePasswordDto } from './dto/update-password.dto';
import { updateEmailDto } from './dto/update-email.dto';
import { verifyEmailUpdateDto } from './dto/verify-email.dto';

@Private()
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  async get(
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.get(loggedUserData);

    return new HttpResponse({
      data,
    });
  }

  @Put()
  async update(
    @Body() postData: updateProfileDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id: loggedUserData.id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'User updated successfully',
      data,
    });
  }

  @Put('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.upload({
      id: loggedUserData.id,
      loggedUserData,
      postData: file,
    });
    return new HttpResponse({
      message: 'Image uploaded successfully',
      data,
    });
  }

  @Put('password')
  async updatePassword(
    @Body() postData: updatePasswordDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.updatePassword({
      id: loggedUserData.id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Password updated successfully',
      data,
    });
  }

  @Put('request-email-update')
  async requestEmailUpdate(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @Body() postData: updateEmailDto,
  ): Promise<HttpResponse> {
    await this.service.requestEmailUpdate({
      id: loggedUserData.id,
      loggedUserData: loggedUserData,
      postData: postData,
    });
    return new HttpResponse({
      message: 'Email verification request sent successfully',
    });
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(
    @Query() postData: verifyEmailUpdateDto,
  ): Promise<HttpResponse> {
    await this.service.verifyEmailUpdateRequest(postData);

    return new HttpResponse({
      message: 'Email changed successfully',
    });
  }
}
