import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class AboutUsSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStory() {
    const response = await this.prisma.aboutUsStory.findFirst({
      select: {
        title: true,
        description: true,
      },
    });

    return response;
  }

  async getAllService() {
    const response = await this.prisma.aboutUsService.findMany({
      select: {
        title: true,
        description: true,
        image: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return response;
  }

  async getMember() {
    const reviews = await this.prisma.teamMember.findMany({
      where: { archive: false, featured: true },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return reviews;
  }
}
