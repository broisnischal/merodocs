import { Module } from '@nestjs/common';
import { ProblemModule } from './problem/problem.module';
import { FeedbackModule } from './feedback/feedback.module';
import { RouterModule } from '@nestjs/core';
import { ClientProblemModule } from './clientproblem/problem.module';

@Module({
  imports: [
    ProblemModule,
    FeedbackModule,
    ClientProblemModule,
    RouterModule.register([
      {
        path: 'superadmin/reports-feedback',
        children: [ProblemModule, FeedbackModule, ClientProblemModule],
      },
    ]),
  ],
})
export class ProblemFeedbackModule {}
