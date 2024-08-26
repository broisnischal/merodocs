import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class ManagementStatisticService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const statistic = await this.prisma.managementStatisticSection.findFirst({
      include: {
        features: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return statistic;
  }
}
