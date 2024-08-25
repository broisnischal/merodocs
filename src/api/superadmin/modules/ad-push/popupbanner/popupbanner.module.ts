import { Module } from '@nestjs/common';
import { PopupBannerController } from './popupbanner.controller';
import { PopupbannerService } from './popupbanner.service';

@Module({
  controllers: [PopupBannerController],
  providers: [PopupbannerService],
})
export class PopupBannerModule {}
