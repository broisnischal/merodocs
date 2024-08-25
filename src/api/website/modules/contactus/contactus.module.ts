import { Module } from '@nestjs/common';
import { ContactUsController } from './contactus.controller';
import { ContactUsService } from './contactus.service';
// import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  // imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 25 }])],
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
