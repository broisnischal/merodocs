import { Module } from '@nestjs/common';
import { PopUpController } from './popup.controller';
import { PopUpService } from './popup.service';

@Module({
  controllers: [PopUpController],
  providers: [PopUpService],
})
export class PopUpModule {}
