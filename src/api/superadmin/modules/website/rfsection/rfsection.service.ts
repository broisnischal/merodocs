import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateParams } from '../../../common/interface';
import { createRFSectionDto } from './dtos/index.dto';

@Injectable()
export class RFSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createRFSectionDto>) {
    const { postData } = data;

    const { title } = postData;

    const alreadyExist = await this.prisma.residentFeatureSection.findFirst();

    const response = alreadyExist
      ? await this.prisma.residentFeatureSection.update({
          where: {
            id: alreadyExist.id,
          },
          data: {
            title,
          },
        })
      : await this.prisma.residentFeatureSection.create({
          data: {
            title,
          },
        });

    return response;
  }

  async getAll() {
    const response = await this.prisma.residentFeatureSection.findFirst({
      select: {
        id: true,
        title: true,
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
