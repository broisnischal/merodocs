import { Module } from '@nestjs/common';
import { ClientProblemController } from './problem.controller';
import { ClientProblemService } from './problem.service';

@Module({
  controllers: [ClientProblemController],
  providers: [ClientProblemService],
})
export class ClientProblemModule {}
