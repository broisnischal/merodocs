import { Module } from '@nestjs/common';
import { MoveoutController } from './moveout.controller';
import { MoveOutService } from './moveout.service';

@Module({
  controllers: [MoveoutController],
  providers: [MoveOutService],
})
export class MoveoutModule {}
