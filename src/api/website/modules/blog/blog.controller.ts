import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('blog')
export class BlogController {
  constructor(private readonly service: BlogService) {}

  @Get('featured')
  async getFeatured() {
    const blogs = await this.service.getFeatured();

    return new HttpResponse({
      data: blogs,
    });
  }

  @Get('category')
  async getCategory() {
    const blogs = await this.service.getCategory();

    return new HttpResponse({
      data: blogs,
    });
  }

  @Get('tags')
  async getTag(@Query() { q }: QueryDto) {
    const blogs = await this.service.getTags({
      q,
    });

    return new HttpResponse({
      data: blogs,
    });
  }
  @Get(':slug')
  async getSingle(@Param() { slug }: { slug: string }) {
    const data = await this.service.getSingle({
      slug,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get()
  async get(@Query() { page, limit, q, filter }: QueryDto) {
    const blogs = await this.service.get({
      page,
      limit,
      q,
      filter,
    });

    return new HttpResponse({
      data: blogs,
    });
  }
}
