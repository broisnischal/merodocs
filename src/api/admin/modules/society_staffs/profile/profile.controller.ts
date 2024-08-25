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
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { updateEmailDto } from './dto/update-email.dto';
import { verifyEmailUpdateDto } from './dto/verify-email.dto';
import { updateProfileDto } from './dto/update-profile.dto';
import { updatePasswordDto } from 'src/api/superadmin/modules/profile/dto/update-password.dto';

@Private()
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  async get(
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.get(loggedUserData);

    return new HttpResponse({
      data,
    });
  }

  @Put()
  async update(
    @Body() postData: updateProfileDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id: loggedUserData.id,
      apartmentId: loggedUserData.apartmentId,
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
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.upload({
      apartmentId: loggedUserData.apartmentId,
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
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() postData: updatePasswordDto,
  ): Promise<HttpResponse> {
    await this.service.updatePassword({
      id: loggedUserData.id,
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData,
    });
    return new HttpResponse({
      message: 'Password changed successfully',
    });
  }

  @Put('request-email-update')
  async requestEmailUpdate(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() postData: updateEmailDto,
  ): Promise<HttpResponse> {
    await this.service.requestEmailUpdate({
      id: loggedUserData.id,
      apartmentId: loggedUserData.apartmentId,
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
