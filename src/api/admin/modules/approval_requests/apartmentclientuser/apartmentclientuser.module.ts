import { Module } from '@nestjs/common';
import { ApartmentClientUserController } from './apartmentclientuser.controller';
import { ApartmentClientUserService } from './apartmentclientuser.service';

@Module({
  controllers: [ApartmentClientUserController],
  providers: [ApartmentClientUserService],
})
export class ApartmentClientUserModule {}
