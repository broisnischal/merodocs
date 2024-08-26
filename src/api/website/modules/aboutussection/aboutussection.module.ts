import { Module } from '@nestjs/common';
import { AboutUsSectionController } from './aboutussection.controller';
import { AboutUsSectionService } from './aboutussection.service';

@Module({
  controllers: [AboutUsSectionController],
  providers: [AboutUsSectionService],
})
export class AboutUsSectionModule {}
