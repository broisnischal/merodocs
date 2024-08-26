import { Module } from '@nestjs/common';
import { CustomerReviewService } from './customerreview.service';
import { CustomerReviewController } from './customerreview.controller';

@Module({
  controllers: [CustomerReviewController],
  providers: [CustomerReviewService],
})
export class CustomerReviewModule {}
