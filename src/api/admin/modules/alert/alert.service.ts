import { PrismaService } from 'src/global/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { GetAllParams } from '../../common/interface';

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  async GetAll(data: GetAllParams) {
    const { apartmentId } = data;

    const logs = await this.prisma.emergencyAlert.findMany({
      where: {
        apartmentId,
      },
      select: {
        id: true,
        type: true,
        history: true,
        createdAt: true,
        surveillance: true,
        respondedBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        respondedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs;
  }
}
