import { Module } from '@nestjs/common';
import { ManagementStatisticController } from './managementstatistic.controller';
import { ManagementStatisticService } from './managementstatistic.service';

@Module({
  controllers: [ManagementStatisticController],
  providers: [ManagementStatisticService],
})
export class ManagementStatisticModule {}
