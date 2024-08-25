import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  GetAllParams,
  GetParam,
} from '../../common/interface/website.interface';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategory() {
    const blogs = await this.prisma.blogCategory.findMany({
      select: {
        id: true,
        title: true,
      },
    });

    return blogs;
  }
  async getFeatured() {
    const blogs = await this.prisma.blog.findMany({
      where: {
        featured: true,
        archive: false,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        cover: true,
        description: true,
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        publishDate: true,
      },
    });

    return blogs;
  }
  async get(data: GetAllParams) {
    const { page, limit, q, filter: categoryId } = data;

    let where: Prisma.BlogWhereInput = {
      archive: false,
      status: 'published',
    };

    if (categoryId) {
      const valid = await this.prisma.blogCategory.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
        },
      });

      if (!valid) {
        throw new BadRequestException('Invalid category id');
      }

      where.categoryId = categoryId;
    }

    if (q) {
      where.tags = {
        some: {
          title: {
            contains: q,
            mode: 'insensitive',
          },
        },
      };
    }

    const blogs = await this.prisma.blog.getAllPaginated(
      {
        limit,
        page,
      },
      {
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          cover: true,
          description: true,
          category: {
            select: {
              id: true,
              title: true,
            },
          },
          publishDate: true,
        },
      },
    );

    return blogs;
  }

  async getSingle(data: GetParam) {
    const { slug } = data;

    const valid = await this.prisma.blog.findUnique({
      where: {
        slug,
        archive: false,
        status: 'published',
      },
    });

    if (!valid) {
      throw new NotFoundException('Blog not found');
    }

    return await this.prisma.blog.findUnique({
      where: {
        slug,
        archive: false,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        content: true,
        category: {
          select: {
            id: true,
            title: true,
            blogs: {
              where: {
                id: {
                  not: valid.id,
                },
                archive: false,
                status: 'published',
              },
              select: {
                id: true,
                title: true,
                slug: true,
                cover: true,
                publishDate: true,
              },
              take: 3,
            },
          },
        },
        tags: {
          select: {
            id: true,
            title: true,
          },
        },
        cover: true,
        publishDate: true,
      },
    });
  }

  async getTags(data: GetAllParams) {
    const response = await this.prisma.blogTag.findMany({
      where: {
        title: {
          contains: data.q,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return response;
  }
}
