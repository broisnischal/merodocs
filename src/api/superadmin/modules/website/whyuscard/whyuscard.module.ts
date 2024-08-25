import { Module } from '@nestjs/common';
import { WhyUsCardService } from './whyuscard.service';
import { WhyUsCardController } from './whyuscard.controller';

@Module({
  controllers: [WhyUsCardController],
  providers: [WhyUsCardService],
})
export class WhyUsCardModule {}
