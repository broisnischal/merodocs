import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateParams, GetAllParams } from '../../../common/interface';
import { createWhyUsSectionDto } from './dtos/index.dto';
import { HomeEnum } from '@prisma/client';

@Injectable()
export class WhyUsSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createWhyUsSectionDto>) {
    const { postData } = data;

    const { title, type } = postData;

    const alreadyExist = await this.prisma.whyUsSection.findUnique({
      where: { type },
    });

    if (!alreadyExist && !title)
      throw new BadRequestException(
        'Title is required for creating a new why us section.',
      );

    const response = alreadyExist
      ? await this.prisma.whyUsSection.update({
          where: {
            id: alreadyExist.id,
          },
          data: {
            title,
            type,
          },
        })
      : await this.prisma.whyUsSection.create({
          data: {
            title,
            type,
          },
        });

    return response;
  }

  async getAll(data: GetAllParams) {
    const { filter } = data;

    if (!filter || !Object.values(HomeEnum).includes(filter as HomeEnum)) {
      throw new NotFoundException('Invalid filter');
    }

    const response = await this.prisma.whyUsSection.findUnique({
      where: { type: filter as HomeEnum },
      select: {
        id: true,
        title: true,
        cards: {
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
