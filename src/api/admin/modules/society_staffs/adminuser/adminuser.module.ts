import { Module } from '@nestjs/common';
import { AdminUserController } from './adminuser.controller';
import { AdminUserService } from './adminuser.service';

@Module({
  controllers: [AdminUserController],
  providers: [AdminUserService],
})
export class AdminUserModule {}
