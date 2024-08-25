import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class CustomerReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const reviews = await this.prisma.homeCustomerReview.findMany({
      where: {
        featured: true,
        archive: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return reviews;
  }
}
