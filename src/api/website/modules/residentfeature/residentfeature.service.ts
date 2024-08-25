import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class ResidentFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const response = await this.prisma.residentFeatureSection.findFirst({
      select: {
        title: true,
        features: {
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
