import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from '../../common/interface';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async getClients() {
    const [total, active, passive, expired] = await Promise.all([
      this.prisma.apartment.count({
        where: {
          OR: [{ status: 'active' }, { status: 'inactive' }],
        },
      }),
      this.prisma.apartment.count({
        where: { status: 'active' },
      }),
      this.prisma.apartment.count({
        where: { status: 'inactive' },
      }),
      this.prisma.apartment.count({
        where: { status: 'expired' },
      }),
    ]);

    return { total, active, passive, expired };
  }

  async getRevenue(data: GetParam) {
    const { month, year } = data;

    if (!month && !year) {
      throw new BadRequestException('Either month or year must be provided.');
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    let firstDay: Date, lastDay: Date;

    if (year) {
      firstDay = new Date(year, 0, 1);
      lastDay = new Date(year, 11, 31);
    } else {
      let currentMonth = month || today.getMonth() + 1;
      firstDay = new Date(currentYear, currentMonth - 1, 1);
      lastDay = new Date(currentYear, currentMonth, 0);
    }

    const paidAggregate = await this.prisma.subscription.aggregate({
      where: {
        createdAt: { gte: firstDay, lte: lastDay },
      },
      _sum: { paid: true },
    });

    const remainingAggregate = await this.prisma.subscription.aggregate({
      where: {
        createdAt: { gte: firstDay, lte: lastDay },
      },
      _sum: { remaining: true },
    });

    return {
      paid: paidAggregate._sum.paid || 0,
      remaining: remainingAggregate._sum.remaining || 0,
      total:
        (paidAggregate._sum.paid || 0) +
        (remainingAggregate._sum.remaining || 0),
    };
  }

  async getExpiringClients(data: GetAllParams) {
    const { limit, page } = data;

    const currentDate = new Date();
    const expiringThresholdDate = new Date(currentDate);

    expiringThresholdDate.setDate(expiringThresholdDate.getDate() + 15);

    const expiringSubscriptions =
      await this.prisma.subscription.getAllPaginated(
        {
          page,
          limit,
        },
        {
          where: {
            endAt: {
              gte: currentDate,
              lte: expiringThresholdDate,
            },
            active: true,
            status: 'active',
          },
          select: {
            apartment: {
              select: {
                id: true,
                name: true,
                area: true,
                city: true,
                country: true,
                postalcode: true,
                province: true,
                subscription: true,
                adminUsers: {
                  where: {
                    role: {
                      name: 'superadmin',
                    },
                  },
                  select: {
                    id: true,
                    image: {
                      select: {
                        url: true,
                      },
                    },
                    name: true,
                    contact: true,
                  },
                },
              },
            },
          },
          orderBy: {
            endAt: 'desc',
          },
        },
      );

    return expiringSubscriptions;
  }

  async getNewClients(data: GetAllParams) {
    const { limit, page } = data;

    const currentDate = new Date();
    const newThresholdDate = new Date(currentDate);

    newThresholdDate.setDate(newThresholdDate.getDate() - 15);

    const newClients = await this.prisma.apartment.getAllPaginated(
      {
        page,
        limit,
      },
      {
        where: {
          createdAt: {
            gte: newThresholdDate,
            lte: currentDate,
          },
        },
        select: {
          id: true,
          name: true,
          area: true,
          city: true,
          country: true,
          postalcode: true,
          province: true,
          subscription: true,
          status: true,
          adminUsers: {
            where: {
              role: {
                name: 'superadmin',
              },
            },
            select: {
              id: true,
              image: {
                select: {
                  url: true,
                },
              },
              name: true,
              contact: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    );

    return newClients;
  }
}
