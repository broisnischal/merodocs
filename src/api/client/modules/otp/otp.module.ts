import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
// import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  // imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 25 }])],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
