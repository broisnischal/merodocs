import { Module } from '@nestjs/common';
import { BlogCategoryService } from './blogcategory.service';
import { BlogCategoryController } from './blogcategory.controller';

@Module({
  controllers: [BlogCategoryController],
  providers: [BlogCategoryService],
})
export class BlogCategoryModule {}
