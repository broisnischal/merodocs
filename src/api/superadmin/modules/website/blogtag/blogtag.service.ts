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
import { createblogTagDto } from './dtos/create-blogtag.dto';
import { updateblogTitleDto } from './dtos/update-blogtag.dto';

@Injectable()
export class BlogTagService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createblogTagDto>) {
    const { postData, loggedUserData } = data;

    const exist = await this.prisma.blogTag.findFirst({
      where: {
        title: { contains: postData.title, mode: 'insensitive' },
      },
    });

    if (exist) throw new ConflictException('Tag already exists');

    const response = await this.prisma.blogTag.create({
      data: {
        ...postData,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    return response;
  }

  async getAll(data: GetAllParams) {
    const response = await this.prisma.blogTag.getAllPaginated(
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

  async update(data: UpdateParams<updateblogTitleDto>) {
    const { loggedUserData, postData, id } = data;

    const valid = await this.prisma.blogTag.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Tag does not exist');

    if (postData.title.toLowerCase() !== valid.title.toLowerCase()) {
      const exist = await this.prisma.blogTag.findFirst({
        where: {
          title: {
            contains: postData.title,
            mode: 'insensitive',
          },
        },
      });

      if (exist) throw new ConflictException('Tag already exists');
    }

    const response = await this.prisma.blogTag.update({
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

    const valid = await this.prisma.blogTag.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Tag does not exists');

    const response = await this.prisma.blogTag.delete({
      where: { id },
    });

    return response;
  }
}
