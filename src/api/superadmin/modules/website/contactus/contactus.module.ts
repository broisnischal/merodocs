import { Module } from '@nestjs/common';
import { ContactUsService } from './contactus.service';
import { ContactUsController } from './contactus.controller';

@Module({
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
