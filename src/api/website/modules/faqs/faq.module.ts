import { Module } from '@nestjs/common';
import { FAQService } from './faq.service';
import { FAQController } from './faq.controller';

@Module({
  controllers: [FAQController],
  providers: [FAQService],
})
export class FAQModule {}
