import { Module } from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { AmenityController } from './amenity.controller';

@Module({
  providers: [AmenityService],
  controllers: [AmenityController],
})
export class AmenityModule {}
