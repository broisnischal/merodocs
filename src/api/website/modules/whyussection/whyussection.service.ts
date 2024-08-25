import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { getWhyUsSectionQueryDto } from './dtos/get-whyussection.dto';

@Injectable()
export class WhyUsSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(data: getWhyUsSectionQueryDto) {
    const response = await this.prisma.whyUsSection.findUnique({
      where: {
        type: data.type,
      },
      select: {
        title: true,
        cards: {
          select: {
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
