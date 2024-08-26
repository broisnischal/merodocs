import { Module } from '@nestjs/common';
import { SUserService } from './services.service';
import { SUserController } from './services.controller';

@Module({
  controllers: [SUserController],
  providers: [SUserService],
  imports: [SUserModule],
})
export class SUserModule {}
