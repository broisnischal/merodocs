import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateParams, GetAllParams } from '../../../common/interface';
import { createHomeSectionDto } from './dtos/index.dto';
import { HomeEnum } from '@prisma/client';

@Injectable()
export class HomeSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createHomeSectionDto>) {
    const { postData } = data;

    const { title, description } = postData;

    const alreadyExist = await this.prisma.homeSection.findUnique({
      where: {
        for: postData.for,
      },
    });

    if (!alreadyExist && (!title || !description))
      throw new BadRequestException(
        'Title and description is required for creating a new home section.',
      );

    const response = alreadyExist
      ? await this.prisma.homeSection.update({
          where: {
            id: alreadyExist.id,
          },
          data: {
            title,
            description,
            for: postData.for,
          },
        })
      : await this.prisma.homeSection.create({
          data: {
            title: title!,
            description: description!,
            for: postData.for,
          },
        });

    return response;
  }

  async getAll(data: GetAllParams) {
    const { filter } = data;

    if (!filter || !Object.values(HomeEnum).includes(filter as HomeEnum)) {
      throw new NotFoundException('Invalid filter');
    }

    const response = await this.prisma.homeSection.findUnique({
      where: { for: filter as HomeEnum },
      select: {
        id: true,
        title: true,
        description: true,
        features: {
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return response;
  }
}
