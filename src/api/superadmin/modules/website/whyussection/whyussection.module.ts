import { Module } from '@nestjs/common';
import { WhyUsSectionController } from './whyussection.controller';
import { WhyUsSectionService } from './whyussection.service';

@Module({
  controllers: [WhyUsSectionController],
  providers: [WhyUsSectionService],
})
export class WhyUsSectionModule {}
