import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class ApartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getApartmentDetails(flatId: string) {
    const response = await this.prisma.flat.findUnique({
      where: {
        id: flatId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        floor: {
          select: {
            id: true,
            name: true,
            block: {
              select: {
                id: true,
                name: true,
                apartment: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    area: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!response) throw new NotFoundException('Flat not found');

    return response;
  }
}
