import { Module } from '@nestjs/common';
import { PetController } from './pets.controller';
import { PetService } from './pets.service';

@Module({
  controllers: [PetController],
  providers: [PetService],
})
export class PetModule {}
