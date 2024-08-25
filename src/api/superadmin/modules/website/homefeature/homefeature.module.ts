import { Module } from '@nestjs/common';
import { HomeFeatureService } from './homefeature.service';
import { HomeFeatureController } from './homefeature.controller';

@Module({
  controllers: [HomeFeatureController],
  providers: [HomeFeatureService],
})
export class HomeFeatureModule {}
