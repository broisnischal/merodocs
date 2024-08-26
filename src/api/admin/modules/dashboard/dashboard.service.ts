import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from '../../common/interface';
import { ClientUserType } from '@prisma/client';
import { getPageDocs, pagination } from 'src/common/utils';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDetail(data: GetParam) {
    const { id, apartmentId } = data;

    const [apartment, flatCount, residentCount] = await Promise.all([
      this.prisma.apartment.findUnique({
        where: { id },
        select: {
          name: true,
          country: true,
          province: true,
          city: true,
          area: true,
          postalcode: true,
          _count: { select: { blocks: true } },
        },
      }),
      this.prisma.flat.count({
        where: { apartmentId, archive: false },
      }),
      this.prisma.clientUser.count({
        where: {
          offline: false,
          currentFlats: {
            some: {
              flat: { apartmentId, archive: false },
            },
          },
        },
      }),
    ]);

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    return { apartment, flatCount, residentCount };
  }

  async getResidentGraph(data: GetParam) {
    const { apartmentId, month } = data;

    const today = new Date();

    // Adding 1 because getMonth() returns zero-based index
    let currentMonth = today.getMonth() + 1;

    // If month is specified in the input data, use that value
    if (month && month >= 1 && month <= 12) {
      currentMonth = month;
    }

    const currentYear = today.getFullYear();

    // Subtracting 1 to get zero-based index
    const firstDayOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 0);
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth, 0);

    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const categories = ['owner', 'tenant'];

    const result: { name: string; current: number; previous: number }[] = [];

    let currentTotal = 0;
    let previousTotal = 0;

    for (const category of categories) {
      const currentMonthCount = await this.prisma.flatCurrentClient.count({
        where: {
          apartmentId,
          createdAt: {
            gte: firstDayOfCurrentMonth,
            lte: lastDayOfCurrentMonth,
          },
          type: category as ClientUserType,
          ...(category === 'tenant' ? { hasOwner: false } : {}),
        },
      });

      const previousMonthCount = await this.prisma.flatCurrentClient.count({
        where: {
          apartmentId,
          createdAt: {
            gte: new Date(previousYear, previousMonth - 1, 1),
            lte: lastDayOfPreviousMonth,
          },
          type: category as ClientUserType,
          ...(category === 'tenant' ? { hasOwner: false } : {}),
        },
      });

      currentTotal += currentMonthCount;
      previousTotal += previousMonthCount;

      result.push({
        name: category,
        current: currentMonthCount,
        previous: previousMonthCount,
      });
    }

    const ownerTenantCurrent = await this.prisma.flatCurrentClient.count({
      where: {
        apartmentId,
        createdAt: {
          gte: firstDayOfCurrentMonth,
          lte: lastDayOfCurrentMonth,
        },
        type: 'tenant',
        hasOwner: true,
      },
    });

    const ownerTenantPrevious = await this.prisma.flatCurrentClient.count({
      where: {
        apartmentId,
        createdAt: {
          gte: new Date(previousYear, previousMonth - 1, 1),
          lte: lastDayOfPreviousMonth,
        },
        type: 'tenant',
        hasOwner: true,
      },
    });

    currentTotal += ownerTenantCurrent;
    previousTotal += ownerTenantPrevious;

    result.push({
      name: 'ownerTenant',
      current: ownerTenantCurrent,
      previous: ownerTenantPrevious,
    });

    return { result, currentTotal, previousTotal };
  }

  async getMovedOutGraph(data: GetParam) {
    const { apartmentId, month } = data;

    const today = new Date();

    // Adding 1 because getMonth() returns zero-based index
    let currentMonth = today.getMonth() + 1;

    // If month is specified in the input data, use that value
    if (month && month >= 1 && month <= 12) {
      currentMonth = month;
    }

    const currentYear = today.getFullYear();

    // Subtracting 1 to get zero-based index
    const firstDayOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 0);
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth, 0);

    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const categories = ['owner', 'tenant'];

    const result: { name: string; current: number; previous: number }[] = [];

    let currentTotal = 0;
    let previousTotal = 0;

    for (const category of categories) {
      const currentMonthCount = await this.prisma.apartmentClientUser.count({
        where: {
          apartmentId,
          createdAt: {
            gte: firstDayOfCurrentMonth,
            lte: lastDayOfCurrentMonth,
          },
          type: category as ClientUserType,
          requestType: 'moveOut',
          status: 'approved',
          ...(category === 'tenant' ? { verifiedById: null } : {}),
        },
      });

      const previousMonthCount = await this.prisma.apartmentClientUser.count({
        where: {
          apartmentId,
          createdAt: {
            gte: new Date(previousYear, previousMonth - 1, 1),
            lte: lastDayOfPreviousMonth,
          },
          type: category as ClientUserType,
          requestType: 'moveOut',
          status: 'approved',
          ...(category === 'tenant' ? { verifiedById: null } : {}),
        },
      });

      currentTotal += currentMonthCount;
      previousTotal += previousMonthCount;

      result.push({
        name: category,
        current: currentMonthCount,
        previous: previousMonthCount,
      });
    }

    const ownerTenantCurrent = await this.prisma.apartmentClientUser.count({
      where: {
        apartmentId,
        createdAt: {
          gte: firstDayOfCurrentMonth,
          lte: lastDayOfCurrentMonth,
        },
        type: 'tenant',
        requestFor: 'admin',
        status: 'approved',
        requestType: 'moveOut',
        verifiedByType: 'owner',
        verifiedById: { not: null },
      },
    });

    const ownerTenantPrevious = await this.prisma.apartmentClientUser.count({
      where: {
        apartmentId,
        createdAt: {
          gte: new Date(previousYear, previousMonth - 1, 1),
          lte: lastDayOfPreviousMonth,
        },
        type: 'tenant',
        requestFor: 'admin',
        status: 'approved',
        requestType: 'moveOut',
        verifiedByType: 'owner',
        verifiedById: { not: null },
      },
    });

    currentTotal += ownerTenantCurrent;
    previousTotal += ownerTenantPrevious;

    result.push({
      name: 'ownerTenant',
      current: ownerTenantCurrent,
      previous: ownerTenantPrevious,
    });

    return { result, currentTotal, previousTotal };
  }

  async getResident(data: GetParam) {
    const { id, apartmentId } = data;

    const apartment = await this.prisma.apartment.findUnique({
      where: { id },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const [owner, ownerTenant, tenant, family] = await Promise.all([
      this.prisma.flatCurrentClient.count({
        where: {
          type: 'owner',
          apartmentId,
          offline: false,
        },
      }),
      this.prisma.flatCurrentClient.count({
        where: {
          type: 'tenant',
          hasOwner: true,
          apartmentId,
          offline: false,
        },
      }),
      this.prisma.flatCurrentClient.count({
        where: {
          type: 'tenant',
          hasOwner: false,
          apartmentId,
          offline: false,
        },
      }),
      this.prisma.flatCurrentClient.count({
        where: {
          OR: [{ type: 'owner_family' }, { type: 'tenant_family' }],
          apartmentId,
          offline: false,
        },
      }),
    ]);

    return { owner, ownerTenant, tenant, family };
  }

  async getOccupancy(data: GetParam) {
    const { id, apartmentId } = data;

    const apartment = await this.prisma.apartment.findUnique({
      where: { id },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const [occupied, vacant, byOwner, byTenant, total] = await Promise.all([
      this.prisma.flat.count({
        where: {
          archive: false,
          apartmentId,
          currentClients: {
            some: {},
          },
        },
      }),
      this.prisma.flat.count({
        where: {
          archive: false,
          apartmentId,
          currentClients: {
            none: {},
          },
        },
      }),
      this.prisma.flat.count({
        where: {
          archive: false,
          apartmentId,
          currentClients: {
            some: {
              OR: [
                {
                  type: 'owner_family',
                },
                { type: 'owner' },
              ],
            },
          },
        },
      }),
      this.prisma.flat.count({
        where: {
          archive: false,
          apartmentId,
          currentClients: {
            some: {
              OR: [
                {
                  type: 'tenant_family',
                },
                { type: 'tenant' },
              ],
              hasOwner: false,
            },
          },
        },
      }),
      this.prisma.flat.count({
        where: {
          archive: false,
          apartmentId,
        },
      }),
    ]);

    return { occupied, vacant, byOwner, byTenant, total };
  }

  async getPoll(data: GetAllParams) {
    const { apartmentId } = data;

    const poll = await this.prisma.poll.findFirst({
      where: {
        archive: false,
        apartmentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        title: true,
        pollAnswers: {
          select: {
            id: true,
            title: true,
            voteCount: true,
          },
        },
        createdAt: true,
      },
    });

    if (!poll) throw new NotFoundException('Poll doesnot exist');

    const totalVoteCount = poll.pollAnswers.reduce(
      (sum, answer) => sum + answer.voteCount,
      0,
    );

    // Calculate percentage for each answer
    const pollAnswersWithPercent = poll.pollAnswers.map((answer) => ({
      ...answer,
      percent:
        totalVoteCount !== 0 ? (answer.voteCount / totalVoteCount) * 100 : 0,
    }));

    return { ...poll, pollAnswers: pollAnswersWithPercent };
  }

  async getRequest(data: GetAllParams) {
    const { apartmentId } = data;

    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const [becomeOwner, accountCreate, addFlat, moveOut, staffAccount] =
      await Promise.all([
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId,
            requestType: 'becomeOwner',
            status: 'pending',
            requestFor: 'admin',
          },
        }),
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId,
            requestType: 'addAccount',
            status: 'pending',
            requestFor: 'admin',
          },
        }),
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId,
            requestType: 'moveIn',
            status: 'pending',
            requestFor: 'admin',
          },
        }),
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId,
            requestType: 'moveOut',
            status: 'pending',
            requestFor: 'admin',
          },
        }),
        this.prisma.clientStaff.count({
          where: {
            apartmentId,
            status: 'pending',
            approvedByAdmin: false,
          },
        }),
      ]);

    return {
      becomeOwner,
      accountCreate: accountCreate + staffAccount,
      addFlat,
      moveOut,
    };
  }

  async getTicket(data: GetAllParams) {
    const { apartmentId } = data;

    const { page, limit, skip } = pagination({
      page: data.page,
      limit: data.limit,
    });

    const maintenance = await this.prisma.maintenance.findMany({
      where: {
        flat: {
          apartmentId,
          archive: false,
        },
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        message: true,
        type: true,
        createdAt: true,
        clientUser: {
          select: {
            name: true,
          },
        },
        flat: {
          select: {
            name: true,
            floor: {
              select: {
                block: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      skip,
      take: limit,
    });

    const count = await this.prisma.maintenance.count({
      where: {
        flat: {
          apartmentId,
          archive: false,
        },
        status: 'pending',
      },
    });

    const docs = getPageDocs({
      page,
      limit,
      count,
    });

    return { docs, data: maintenance };
  }
}
