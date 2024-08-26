import { Module } from '@nestjs/common';
import { ServiceUserController } from './serviceuser.controller';
import { ServiceUserService } from './serviceuser.service';

@Module({
  controllers: [ServiceUserController],
  providers: [ServiceUserService],
})
export class ServiceUserModule {}
