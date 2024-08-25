import { Module } from '@nestjs/common';
import { HomePageController } from './homepage.controller';
import { HomePageService } from './homepage.service';

@Module({
  controllers: [HomePageController],
  providers: [HomePageService],
})
export class HomePageModule {}
