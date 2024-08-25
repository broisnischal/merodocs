import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class ResidentManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const response = await this.prisma.residentManagementSection.findMany({
      select: {
        title: true,
        description: true,
        image: true,
        type: true,
        features: {
          select: {
            description: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const order = [
      'resident_management',
      'apartment_management',
      'visitor_management',
    ];

    response.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

    return response;
  }
}
