import { Module } from '@nestjs/common';
import { ClientCommonController } from './clientcommon.controller';
import { ClientCommonService } from './clientcommon.service';

@Module({
  controllers: [ClientCommonController],
  providers: [ClientCommonService],
})
export class ClientCommonModule {}
