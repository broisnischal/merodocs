import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { getHomePageQueryDto } from './dtos/get-homepage.dto';

@Injectable()
export class HomePageService {
  constructor(private readonly prisma: PrismaService) {}

  async getByType(data: getHomePageQueryDto) {
    const response = await this.prisma.homeSection.findUnique({
      where: {
        for: data.type,
      },
      select: {
        title: true,
        description: true,
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

  async getAll() {
    const response = await this.prisma.homeSection.findMany({
      select: {
        for: true,
        title: true,
        description: true,
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
    const order = ['forResident', 'forGuard', 'forManagement'];

    response.sort((a, b) => order.indexOf(a.for) - order.indexOf(b.for));

    return response;
  }
}
