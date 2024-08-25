import { Module } from '@nestjs/common';
import { SocietyController } from './society.controller';
import { SocietyService } from './society.service';

@Module({
  controllers: [SocietyController],
  providers: [SocietyService],
})
export class SocietyModule {}
