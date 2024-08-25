import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignedUserParam } from 'src/api/client/common/interfaces';
import { EnvService } from 'src/global/env/env.service';

import { PrismaService } from 'src/global/prisma/prisma.service';

@Injectable()
export class NoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  async getRecent({ user }: AssignedUserParam.GetAll) {
    const currentDate = new Date();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(
      currentDate.getDate() - this.env.get('HOME_NOTICE_DAYS'),
    );

    const notices = await this.prisma.notice.existMany(user.apartmentId, {
      where: {
        archive: false,
        createdAt: {
          gte: thirtyDaysAgo,
          lte: currentDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        category: true,
        message: true,
        document: {
          select: {
            url: true,
          },
        },
        createdAt: true,
      },
    });

    return notices;
  }

  async getAll({ filter, user, page, limit }: AssignedUserParam.GetAll) {
    let whereClause: any = {
      archive: false,
    };

    if (filter && !isNaN(Date.parse(filter))) {
      const filterDate = new Date(filter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause = {
        ...whereClause,
        AND: [
          {
            createdAt: {
              gte: filterDate.toISOString(),
            },
          },
          {
            createdAt: {
              lt: nextDay.toISOString(),
            },
          },
        ],
      };
    }

    const notices = await this.prisma.notice.getAllPaginatedById(
      {
        apartmentId: user.apartmentId,
        page,
        limit,
      },
      {
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          category: true,
          message: true,
          document: {
            select: {
              url: true,
            },
          },
          createdAt: true,
        },
      },
    );

    return notices;
  }

  async getById({ id, user }: AssignedUserParam.Get) {
    const notice = await this.prisma.notice.findFirst({
      where: {
        id,
        archive: false,
        apartmentId: user.apartmentId,
      },
      select: {
        id: true,
        title: true,
        category: true,
        message: true,
        document: {
          select: {
            url: true,
          },
        },
        createdAt: true,
      },
    });

    if (!notice) throw new NotFoundException('Notice does not exist');

    return notice;
  }
}
