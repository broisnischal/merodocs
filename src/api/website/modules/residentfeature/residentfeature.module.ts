import { Module } from '@nestjs/common';
import { ResidentFeatureController } from './residentfeature.controller';
import { ResidentFeatureService } from './residentfeature.service';

@Module({
  controllers: [ResidentFeatureController],
  providers: [ResidentFeatureService],
})
export class ResidentFeatureModule {}
