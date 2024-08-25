import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  // imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 25 }])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
