import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import {
  Apartment,
  ClientUnassigned,
  Flat,
  FlatClientUser,
  FlatNotClientUser,
} from '../../common/decorators/client-user';
import {
  CreateOfflineUserDto,
  UpdateClientUserDto,
} from './dto/create-user.dto';
import { UserService } from './user.service';
import {
  requestEmailChangeDto,
  verifyEmailChangeDto,
} from './dto/change-email.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@FlatNotClientUser() user: FlatOrUserId) {
    const res = await this.userService.getUser(user);

    return new HttpResponse({
      message: 'User profile!',
      data: res,
    });
  }

  @Get('passcode')
  async generatePasscode(@FlatClientUser() user: FlatClientUserAuth) {
    const res = await this.userService.generatePassCode({
      user,
    });

    return new HttpResponse({
      message: 'Passcode generated!',
      data: res,
    });
  }

  @Get('currentflat')
  async getCurrentFlat(@FlatClientUser() user: FlatClientUserAuth) {
    const res = await this.userService.getCurrentFlatDetails({ user });

    return new HttpResponse({
      message: 'Current flat retrived!',
      data: res,
    });
  }
  @Get('currentflatdetail')
  async getCurrentFlatDetail(@FlatClientUser() user: FlatClientUserAuth) {
    const res = await this.userService.getCurrentFlatDetailsWithStatus({
      user,
    });

    return new HttpResponse({
      message: 'Current flat retrived!',
      data: res,
    });
  }

  @Get('flats')
  async getUserFlats(@FlatNotClientUser() user: FlatOrUserId) {
    const res = await this.userService.getOtherFlats(user);

    return new HttpResponse({
      message: 'Flats retrived!',
      data: res!,
    });
  }

  @Get('setting')
  async getSetting(@FlatClientUser() user: FlatClientUserAuth) {
    const res = await this.userService.getSettings(user);

    return new HttpResponse({
      message: 'User current flat retrived successfully!',
      data: res!,
    });
  }

  @Put()
  @UseInterceptors(FileInterceptor('image'))
  async updateUser(
    @Body() body: UpdateClientUserDto,
    @ClientUnassigned() user: CurrentClientUser,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: MainFile,
  ) {
    const updatedUser = await this.userService.updateUser({
      body,
      extend: {
        file,
      },
      user,
    });

    return new HttpResponse({ message: 'User updated', data: updatedUser });
  }

  @Get()
  async getStatus(
    @FlatNotClientUser() user: CurrentClientUser,
    @Apartment() apartmentId: string,
    @Flat() flatId: string,
  ): Promise<HttpResponse> {
    await this.userService.getStatus({
      user: { ...user, apartmentId, flatId },
    });

    return new HttpResponse({});
  }

  @Put('change-to-nonresiding') // ? For owner only
  async changeToNonResiding(@FlatClientUser() user: FlatClientUserAuth) {
    await this.userService.changeToNonResidingOwner({
      user,
    });

    return new HttpResponse({
      message:
        'Your residency status is successfully changed to Non Residing owner.',
    });
  }

  @Post('offline')
  @UseInterceptors(FileInterceptor('image'))
  async createOfflineUser(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Body() body: CreateOfflineUserDto,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ) {
    const user = await this.userService.createOfflineUser({
      body,
      file,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Offline user created',
      data: user,
    });
  }

  @Get('request-verify-email')
  async requestVerifyEmail(@ClientUnassigned() user: CurrentClientUser) {
    await this.userService.requestVerifyEmail({ user });

    return new HttpResponse({
      message: 'Email verification link sent',
    });
  }

  @Post('verify-email')
  async verifyEmail(
    @ClientUnassigned() user: CurrentClientUser,
    @Body() body: verifyEmailChangeDto,
  ) {
    await this.userService.verifyEmail({
      user,
      body,
    });

    return new HttpResponse({
      message: 'Email verified successfully',
    });
  }

  @Post('request-email-change')
  async requestEmailChange(
    @ClientUnassigned() user: CurrentClientUser,
    @Body() body: requestEmailChangeDto,
  ) {
    await this.userService.requestEmailChange({ user, body });

    return new HttpResponse({
      message: 'Email verification link sent',
    });
  }

  @Post('verify-email-change')
  async verifyEmailChange(
    @ClientUnassigned() user: CurrentClientUser,
    @Body() body: verifyEmailChangeDto,
  ) {
    await this.userService.verifyChangeEmail({
      user,
      body,
    });

    return new HttpResponse({
      message: 'Email verified successfully',
    });
  }
}
