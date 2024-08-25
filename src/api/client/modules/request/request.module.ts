import { Module } from '@nestjs/common';
import { ReqController } from './request.controller';
import { ReqService } from './request.service';

@Module({
  controllers: [ReqController],
  providers: [ReqService],
})
export class ReqModule {}
