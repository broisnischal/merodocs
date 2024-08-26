import { Module } from '@nestjs/common';
import { RFSectionController } from './rfsection.controller';
import { RFSectionService } from './rfsection.service';

@Module({
  controllers: [RFSectionController],
  providers: [RFSectionService],
})
export class RFSectionModule {}
