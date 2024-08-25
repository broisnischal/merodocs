import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginAdminUserDto } from './dtos/login.dto';

import { HttpResponse } from 'src/common/utils';
import { ParamId, Public } from 'src/common/decorators';
import { logoutAdminUserDto } from './dtos/logout.dto';
import { AdminLoggedUser } from '../../common/decorators';
import { AdminUser } from '@prisma/client';
import { Request } from 'express';
import { RequestResetUserDto } from './dtos/request-reset.dto';
import { ResetUserPasswordDto } from './dtos/reset-password.dto';
// import { ThrottlerBehindProxyGuard } from 'src/common/guards/index';
// import { SkipThrottle } from '@nestjs/throttler';

// @UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes()
  async login(@Body() postData: loginAdminUserDto): Promise<HttpResponse> {
    const data = await this.service.login(postData);

    return new HttpResponse({
      message: 'User successfully login',
      data,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() postData: { token: string | undefined },
  ): Promise<HttpResponse> {
    const data = await this.service.refresh(postData.token);

    return new HttpResponse({
      message: 'Token refreshed successfully',
      data,
    });
  }

  // // @SkipThrottle()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Body() postData: logoutAdminUserDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Req() req: Request,
  ): Promise<HttpResponse> {
    const tokenWithBearer = req.headers.authorization as string;
    const accessToken = tokenWithBearer.split(' ')[1];

    await this.service.logout({
      apartmentId: loggedUserData.apartmentId,
      loggedUserData,
      postData: {
        accessToken,
        refreshToken: postData.refreshToken,
        deviceId: postData.deviceId,
      },
    });

    return new HttpResponse({
      message: 'Logout successfully',
    });
  }

  @Public()
  @Post('request-reset')
  @HttpCode(200)
  async requestReset(
    @Body() postData: RequestResetUserDto,
  ): Promise<HttpResponse> {
    await this.service.requestResetPassword(postData);

    return new HttpResponse({
      message: 'Reset password link sent successfully',
    });
  }

  @Public()
  @Get('verify-reset/:id')
  @HttpCode(200)
  async verifyReset(
    @Query() { token }: { token: string },
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.verifyResetPasswordToken({ id, token });

    return new HttpResponse({
      message: 'Link verified successfully',
    });
  }

  @Public()
  @Post('reset-password/:id')
  @HttpCode(200)
  async resetPassword(
    @Body() postData: ResetUserPasswordDto,
    @Query() { token }: { token: string },
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.resetPassword({
      password: postData.password,
      id,
      token,
    });

    return new HttpResponse({
      message: 'Password reset successfully',
    });
  }
}
