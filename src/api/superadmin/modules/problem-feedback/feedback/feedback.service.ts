import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from 'src/api/superadmin/common/interface';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}
  async getSingle(data: GetParam) {
    const { id } = data;

    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      select: {
        id: true,
        message: true,
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        updatedAt: true,
        createdBy: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    if (!feedback) throw new NotFoundException('Feedback does not exist');

    return feedback;
  }

  async getAll(data: GetAllParams) {
    const { page, limit } = data;

    const feedbacks = await this.prisma.feedback.getAllPaginated(
      {
        page,
        limit,
      },
      {
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          message: true,
          attachments: {
            select: {
              name: true,
              url: true,
            },
          },
          updatedAt: true,
          createdBy: {
            select: {
              name: true,
              contact: true,
              role: {
                select: {
                  name: true,
                },
              },
              image: {
                select: {
                  url: true,
                },
              },
              apartment: {
                select: {
                  name: true,
                  area: true,
                  city: true,
                  country: true,
                  postalcode: true,
                  province: true,
                },
              },
            },
          },
        },
      },
    );

    return feedbacks;
  }
}
