import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { Public } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { OTPVerifyDto } from './dto/otp.dto';
// import { ThrottlerBehindProxyGuard } from 'src/common/guards/index';

// @UseGuards(ThrottlerBehindProxyGuard)
@Public()
@Controller('otp')
export class OtpController {
  constructor(private readonly service: OtpService) {}

  @Post('/verify')
  async verifyOtp(@Body() body: OTPVerifyDto) {
    const data = await this.service.verifyOtp({ data: body });
    return new HttpResponse({
      message: `OTP ${data ? 'verified successfully' : 'failed to verified'}`,
      data,
    });
  }
}
