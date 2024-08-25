import { Module } from '@nestjs/common';
import { VideoSectionController } from './videosection.controller';
import { VideoSectionService } from './videosection.service';

@Module({
  controllers: [VideoSectionController],
  providers: [VideoSectionService],
})
export class VideoSectionModule {}
