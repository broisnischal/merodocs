import { Module } from '@nestjs/common';
import { TeamMemberService } from './teammember.service';
import { TeamMemberController } from './teammember.controller';

@Module({
  controllers: [TeamMemberController],
  providers: [TeamMemberService],
})
export class TeamMemberModule {}
