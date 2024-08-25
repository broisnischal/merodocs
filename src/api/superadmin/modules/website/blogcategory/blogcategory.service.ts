import {
  NotFoundException,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from '../../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createblogCategoryDto } from './dtos/create-blogcategory.dto';
import { updateblogCategoryDto } from './dtos/update-blogcategory.dto';

@Injectable()
export class BlogCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createblogCategoryDto>) {
    const { postData, loggedUserData } = data;

    const categoryexist = await this.prisma.blogCategory.findFirst({
      where: {
        title: {
          contains: postData.title,
          mode: 'insensitive',
        },
      },
    });

    if (categoryexist) throw new ConflictException('Category already exists');

    const response = await this.prisma.blogCategory.create({
      data: {
        ...postData,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    return response;
  }

  async getAll(data: GetAllParams) {
    const response = await this.prisma.blogCategory.getAllPaginated(
      {
        page: data.page,
        limit: data.limit,
      },
      {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
          updatedBy: {
            select: {
              name: true,
            },
          },
        },
      },
    );

    return response;
  }

  async update(data: UpdateParams<updateblogCategoryDto>) {
    const { loggedUserData, postData, id } = data;

    const valid = await this.prisma.blogCategory.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Category does not exist');

    if (postData.title.toLowerCase() !== valid.title.toLowerCase()) {
      const categoryexist = await this.prisma.blogCategory.findFirst({
        where: {
          title: {
            contains: postData.title,
            mode: 'insensitive',
          },
        },
      });

      if (categoryexist) throw new ConflictException('Category already exists');
    }

    const response = await this.prisma.blogCategory.update({
      where: { id },
      data: {
        ...postData,
        updatedById: loggedUserData.id,
      },
    });

    return response;
  }

  async delete(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        blogs: true,
      },
    });

    if (!valid) throw new NotFoundException('Category does not exists');

    if (valid.blogs.length > 0) {
      throw new ConflictException(
        'Blog are present in this category. You may update the category',
      );
    }

    const response = await this.prisma.blogCategory.delete({
      where: { id },
    });

    return response;
  }
}
