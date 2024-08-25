import { Module } from '@nestjs/common';
import { GuardUserController } from './guarduser.controller';
import { GuardUserService } from './guarduser.service';

@Module({
  controllers: [GuardUserController],
  providers: [GuardUserService],
})
export class GuardUserModule {}
