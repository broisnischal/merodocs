import { Module } from '@nestjs/common';
import { NPCSectionController } from './npcsection.controller';
import { NPCSectionService } from './npcsection.service';

@Module({
  controllers: [NPCSectionController],
  providers: [NPCSectionService],
})
export class NPCSectionModule {}
