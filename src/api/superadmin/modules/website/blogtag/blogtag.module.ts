import { Module } from '@nestjs/common';
import { BlogTagService } from './blogtag.service';
import { BlogTagController } from './blogtag.controller';

@Module({
  controllers: [BlogTagController],
  providers: [BlogTagService],
})
export class BlogTagModule {}
