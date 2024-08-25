import { Module } from '@nestjs/common';
import { ServiceRoleController } from './servicerole.controller';
import { ServiceRoleService } from './servicerole.service';

@Module({
  controllers: [ServiceRoleController],
  providers: [ServiceRoleService],
})
export class ServiceRoleModule {}
