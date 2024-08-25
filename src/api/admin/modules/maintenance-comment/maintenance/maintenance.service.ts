import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  GetAllParams,
  UpdateParams,
} from '../../../common/interface/admin.interface';
import { updateMaintenanceDto } from './dtos/maintenance.dto';
import { getPageDocs, pagination } from 'src/common/utils';
import { MaintenanceStatus, MaintenanceTypeEnum } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSingle(data: { id: string; apartmentId: string }) {
    const { id } = data;

    const maintenance = await this.prisma.maintenance.findUnique({
      where: {
        id,
        flat: {
          apartmentId: data.apartmentId,
        },
      },
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
        comments: {
          select: {
            clientUser: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
            image: {
              select: {
                url: true,
              },
            },
            id: true,
            message: true,
            adminUser: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                    id: true,
                  },
                },
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
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
    });

    if (!maintenance) throw new NotFoundException('Maintenance does not exist');

    return maintenance;
  }

  async getAll(
    data: GetAllParams<{
      ticketStatus?: MaintenanceStatus;
      ticketType?: MaintenanceTypeEnum;
    }>,
  ) {
    const { apartmentId, extended, q } = data;

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
        type: extended?.ticketType ? extended.ticketType : undefined,
        status: extended?.ticketStatus ? extended.ticketStatus : undefined,
        OR: [
          {
            clientUser: {
              name: { contains: q ? q : undefined, mode: 'insensitive' },
            },
          },
          {
            message: { contains: q ? q : undefined, mode: 'insensitive' },
          },
        ],
      },
      select: {
        id: true,
        category: true,
        status: true,
        ticketId: true,
        createdAt: true,
        clientUser: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        type: true,
        flat: {
          select: {
            name: true,
            floor: {
              select: {
                name: true,
                block: {
                  select: { name: true },
                },
              },
            },
          },
        },
        message: true,
        images: {
          select: {
            url: true,
            id: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        adminUser: {
          select: {
            name: true,
            id: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedAt: true,
        comments: {
          select: {
            message: true,
            image: {
              select: {
                url: true,
              },
            },
            adminUser: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
            clientUser: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip,
    });

    const count = await this.prisma.maintenance.count({
      where: {
        flat: {
          apartmentId,
          archive: false,
        },
        type: extended?.ticketType ? extended.ticketType : undefined,
        status: extended?.ticketStatus ? extended.ticketStatus : undefined,
        OR: [
          {
            clientUser: {
              name: { contains: q ? q : undefined, mode: 'insensitive' },
            },
          },
          {
            message: { contains: q ? q : undefined, mode: 'insensitive' },
          },
        ],
      },
    });

    const response = await Promise.all(
      maintenance.map(async (item) => {
        const unReadMessage = await this.prisma.maintenanceComment.count({
          where: { maintenanceId: item.id, isRead: false },
        });

        const result = {
          ...item,
          unReadMessage,
        };

        return result;
      }),
    );

    const docs = getPageDocs({
      page,
      limit,
      count,
    });

    return { docs, data: response };
  }

  async update(data: UpdateParams<updateMaintenanceDto>) {
    const { apartmentId, loggedUserData, postData, id } = data;

    const { status } = postData;

    const valid = await this.prisma.maintenance.findFirst({
      where: {
        id,
        flat: {
          apartmentId,
        },
      },
    });

    if (!valid) throw new NotFoundException('Maintenance doesnot exist');

    const maintenance = await this.prisma.maintenance.update({
      where: { id },
      data: {
        status,
        updatedById: loggedUserData.id,
      },
    });

    return maintenance;
  }

  async read(data: UpdateParams<undefined>) {
    const { apartmentId, id } = data;

    const validMaintenance = await this.prisma.maintenance.findFirst({
      where: {
        id,
        flat: {
          apartmentId,
        },
      },
    });

    if (!validMaintenance) {
      throw new NotFoundException('Maintenance does not exist');
    }

    const comments = await this.prisma.maintenanceComment.findMany({
      where: { maintenanceId: validMaintenance.id },
    });

    for (const comment of comments) {
      await this.prisma.maintenanceComment.update({
        where: { id: comment.id },
        data: {
          isRead: true,
        },
      });
    }

    return comments;
  }
}
