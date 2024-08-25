import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginGuardUserDto } from './dtos/login.dto';
import { HttpResponse } from 'src/common/utils';
import { Public } from 'src/common/decorators';
import { CurrentGuardUser } from '../../common/decorators';
import { logoutAdminUserDto } from 'src/api/admin/modules/auth/dtos/logout.dto';
import { Request } from 'express';
// import { ThrottlerBehindProxyGuard } from 'src/common/guards';
// import { SkipThrottle } from '@nestjs/throttler';

// @UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() postData: loginGuardUserDto): Promise<HttpResponse> {
    const data = await this.service.login(postData);

    return new HttpResponse({
      message: 'User successfully login',
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
    @Body() postData: logoutAdminUserDto,
    @CurrentGuardUser() loggedUserData: CurrentGuardUser,
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
}
