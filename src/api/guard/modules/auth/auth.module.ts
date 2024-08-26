import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  // imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 25 }])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
