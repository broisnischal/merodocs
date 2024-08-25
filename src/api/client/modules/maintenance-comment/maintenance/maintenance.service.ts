import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignedUserParam } from '../../../common/interfaces';
import { createMaintenanceDto } from './dtos/maintenance.dto';
import { generateTicketId } from '../../../common/utils/uuid.utils';
import { MaintenanceTypeEnum, Prisma } from '@prisma/client';
import { FileService } from 'src/global/file/file.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { AdminNotificationService } from 'src/global/notification/admin-notification.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly fileService: FileService,
    private readonly notification: AdminNotificationService,
  ) {}

  async create({
    body,
    user,
  }: AssignedUserParam.Create<
    createMaintenanceDto & { files: Express.Multer.File[] }
  >) {
    const { type, category, message } = body;

    const ticketId = generateTicketId();

    const maintenance = await this.prisma.$transaction(async (prisma) => {
      const maintenance = await prisma.maintenance.create({
        data: {
          flatId: user.flatId,
          ticketId,
          type,
          category,
          message,
          clientUserId: user.id,
        },
      });

      if (body.files) {
        await Promise.all(
          body.files.map(async (file) => {
            const item = await this.fileService.create({
              file,
              type: 'image',
            });

            if (!item.id) {
              throw new Prisma.PrismaClientKnownRequestError(
                'File upload failed',
                {
                  clientVersion: '5.13.0',
                  code: 'C409',
                },
              );
            }

            await prisma.maintenance.update({
              where: { id: maintenance.id },
              data: {
                images: {
                  connect: {
                    id: item.id,
                  },
                },
              },
            });
          }),
        );
      }

      return maintenance;
    });

    await this.notification.create({
      type: 'maintenance_ticket',
      apartmentId: user.apartmentId,
      newTicket: true,
    });

    const updateddata = await this.prisma.maintenance.findUnique({
      where: { id: maintenance.id },
      include: {
        images: true,
      },
    });

    if (!updateddata) throw new NotFoundException('Maintenance doesnot exist');

    return updateddata;
  }

  async getAll({ user, filter }: AssignedUserParam.GetAll) {
    if (
      filter !== MaintenanceTypeEnum.private &&
      filter !== MaintenanceTypeEnum.public
    )
      throw new NotFoundException('Filter doesnot exist');

    let whereCondition: any = {
      type: filter,
    };

    if (filter === MaintenanceTypeEnum.private) {
      whereCondition.clientUserId = user.id;
      whereCondition.flatId = user.currentState.flatId;
    }

    if (filter === MaintenanceTypeEnum.public) {
      whereCondition.flat = { apartmentId: user.apartmentId };
    }

    const maintenance = await this.prisma.maintenance.findMany({
      where: whereCondition,
      select: {
        id: true,
        type: true,
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
        message: true,
        _count: {
          select: {
            comments: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
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
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return maintenance;
  }

  async get({ user, id }: AssignedUserParam.Get) {
    const maintenance = await this.prisma.maintenance.findFirst({
      where: {
        id,
        flat: { apartmentId: user.apartmentId },
      },
      select: {
        id: true,
        type: true,
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
        message: true,
        _count: {
          select: {
            comments: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
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
    });

    return maintenance;
  }

  async upload({
    body,
    id,
    user,
  }: AssignedUserParam.Update<Express.Multer.File>) {
    const valid = await this.prisma.maintenance.findFirst({
      where: { id, flatId: user.flatId },
      select: {
        images: true,
      },
    });

    if (!valid) throw new NotFoundException('Maintenance doesnot exist');

    const file = await this.fileService.createOrUpdate({
      file: body,
      type: 'image',
    });

    const maintenance = await this.prisma.maintenance.update({
      where: { id },
      data: {
        images: {
          connect: file,
        },
      },
      select: {
        images: {
          select: {
            url: true,
          },
        },
      },
    });

    return maintenance;
  }
}
