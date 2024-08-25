import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ParamId, Public } from 'src/common/decorators';
import { loginSuperAdminDto } from './dtos/login.dto';
import { HttpResponse } from 'src/common/utils';
import { SuperAdminUser } from '../../common/decorators';
import { AdminUser } from '@prisma/client';
import { LogoutUserDto } from './dtos/logout.dto';
import { Request } from 'express';
import { RequestResetUserDto } from 'src/api/admin/modules/auth/dtos/request-reset.dto';
import { ResetUserPasswordDto } from 'src/api/admin/modules/auth/dtos/reset-password.dto';
// import { SkipThrottle } from '@nestjs/throttler';
// import { ThrottlerBehindProxyGuard } from 'src/common/guards/index';

// @UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() postData: loginSuperAdminDto): Promise<HttpResponse> {
    const data = await this.service.login(postData);

    return new HttpResponse({
      message: 'User logged in succesfully',
      data,
    });
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() postData: { token: string | undefined },
  ): Promise<HttpResponse> {
    const data = await this.service.refresh(postData.token);

    return new HttpResponse({
      message: 'Token refreshed successfully',
      data,
    });
  }

  // @SkipThrottle()
  @Post('logout')
  async logout(
    @Body() postData: LogoutUserDto,
    @SuperAdminUser() loggedUserData: AdminUser,
    @Req() req: Request,
  ): Promise<HttpResponse> {
    const tokenWithBearer = req.headers.authorization as string;
    const accessToken = tokenWithBearer.split(' ')[1];

    await this.service.logout({
      loggedUserData,
      postData: {
        accessToken,
        refreshToken: postData.refreshToken,
      },
    });

    return new HttpResponse({
      message: 'Logout successfully',
    });
  }

  @Public()
  @Post('request-reset')
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
