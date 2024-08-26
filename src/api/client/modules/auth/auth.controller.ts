import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ParamId, Public } from 'src/common/decorators';
import { AuthService } from './auth.service';
import { HttpResponse } from 'src/common/utils';
import { FlatNotClientUser } from '../../common/decorators';
import { RefreshDto, SwitchDto, signUpClientUserDto } from './dtos/auth.dto';
import {
  verifyChangeNumberDto,
  verifyChangeNumberWithEmailDto,
} from './dtos/change-number.dto';
import { logoutAdminUserDto } from 'src/api/admin/modules/auth/dtos/logout.dto';
import { Request } from 'express';
// import { ThrottlerBehindProxyGuard } from 'src/common/guards/index';
// import { SkipThrottle } from '@nestjs/throttler';

// @UseGuards(ThrottlerBehindProxyGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('')
  @HttpCode(200)
  async signup(@Body() body: signUpClientUserDto) {
    const data = await this.service.signup(body);

    return new HttpResponse({
      message: 'OTP sent sucessfully',
      data,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshDto): Promise<HttpResponse> {
    const data = await this.service.refresh(body.token);

    return new HttpResponse({
      message: 'Token refreshed successfully',
      data,
    });
  }

  // @SkipThrottle()
  @Post('switch')
  async switch(
    @Body() body: SwitchDto,
    @FlatNotClientUser() user: FlatOrUserId,
  ) {
    const data = await this.service.switch(user, body);

    return new HttpResponse({
      message: 'Account flat switched',
      data,
    });
  }

  // @SkipThrottle()
  @Post('logout')
  @UsePipes()
  async logout(
    @Body() postData: logoutAdminUserDto,
    @FlatNotClientUser() loggedUserData: CurrentClientUser,
    @Req() req: Request,
  ) {
    const tokenWithBearer = req.headers.authorization as string;
    const accessToken = tokenWithBearer.split(' ')[1];

    await this.service.logout({
      loggedUserData,
      postData: {
        accessToken,
        refreshToken: postData.refreshToken,
        deviceId: postData.deviceId,
      },
    });

    return new HttpResponse({
      message: 'Log out succesful',
    });
  }

  @Public()
  @Post('reset')
  async reset(@Body() body: signUpClientUserDto) {
    const data = await this.service.requestChangeNumber(body);

    return new HttpResponse({
      message: 'Number reset link sucessfully',
      data,
    });
  }

  @Public()
  @Post('verify/:id')
  async verify(
    @ParamId() id: string,
    @Body() { code }: verifyChangeNumberWithEmailDto,
  ) {
    if (!code) throw new BadRequestException('Code is required');

    const data = await this.service.verifyChangeNumberWithEmail({ id, code });

    return new HttpResponse({
      message: 'User verified sucessfully',
      data: {
        hash: data,
      },
    });
  }

  @Public()
  @Post('change/:id')
  async change(@ParamId() id: string, @Body() body: verifyChangeNumberDto) {
    const data = await this.service.changeNumber({ id, postData: body });

    return new HttpResponse({
      message: 'OTP sent successfully',
      data,
    });
  }

  @Public()
  @Post('verify-otp/:id')
  async verifyAndUpdateNumber(
    @ParamId() id: string,
    @Body() body: { otp: string; hash: string },
  ) {
    await this.service.verifyAndUpdateNumber(id, body.otp, body.hash);

    return new HttpResponse({
      message: 'Number updated successfully',
    });
  }
}
