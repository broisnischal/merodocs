import { Module } from '@nestjs/common';
import { ResidentFeatureService } from './residentfeature.service';
import { ResidentFeatureController } from './residentfeature.controller';

@Module({
  controllers: [ResidentFeatureController],
  providers: [ResidentFeatureService],
})
export class ResidentFeatureModule {}
