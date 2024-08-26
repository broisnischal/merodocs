import { Module } from '@nestjs/common';
import { HomeSectionController } from './homesection.controller';
import { HomeSectionService } from './homesection.service';

@Module({
  controllers: [HomeSectionController],
  providers: [HomeSectionService],
})
export class HomeSectionModule {}
