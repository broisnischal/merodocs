import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignedUserParam } from '../../common/interfaces';
import {
  CreateGuestDto,
  MultiGuestDto,
  MultiGuestOnePassDto,
} from './dto/guest.dto';
import { generateGatePassId } from '../../common/utils/uuid.utils';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { GuardNotificationService } from 'src/global/notification/guard-notification.service';
import moment from 'moment';

@Injectable()
export class GuestService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly notification: GuardNotificationService,
  ) {}

  async createGuest({ body, user }: AssignedUserParam.Create<CreateGuestDto>) {
    const { startDate, endDate, contact, isOneDay } = body;

    if (!startDate || !endDate || startDate >= endDate) {
      throw new BadRequestException('Invalid start date or end date');
    }

    // Compare with current date
    const currentDate = moment().startOf('day').toDate();
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj < currentDate || endDateObj < currentDate) {
      throw new BadRequestException(
        'Start date or end date cannot be in the past',
      );
    }

    if (startDateObj >= endDateObj)
      throw new BadRequestException(
        'Start date cannot be greater than or equal to end date',
      );

    const checkInFrequent = await this.prisma.frequentVisitor.findUnique({
      where: {
        contact_clientId: {
          contact,
          clientId: user.id,
        },
      },
    });

    if (!checkInFrequent) {
      await this.prisma.frequentVisitor.create({
        data: {
          contact,
          clientId: user.id,
          count: 1,
        },
      });
    } else {
      await this.prisma.frequentVisitor.update({
        where: {
          id: checkInFrequent.id,
        },
        data: { count: { increment: 1 } },
      });
    }

    const guest = await this.prisma.guest.create({
      data: {
        name: body.name,
        contact,
        isOneDay,
        startDate,
        endDate,
        createdById: user.id,
        createdByType: user.currentState.type,
        flatId: user.flatId,
        gatePass: {
          create: {
            code: generateGatePassId(),
            backgroundImage: body.backgroundImage,
            flatId: user.flatId,
            apartmentId: user.apartmentId,
          },
        },
      },
      include: {
        gatePass: {
          select: {
            id: true,
            code: true,
          },
        },
        flat: {
          select: {
            name: true,
            floor: { select: { block: { select: { name: true } } } },
            apartment: { select: { id: true } },
          },
        },
        createdBy: { select: { name: true } },
      },
    });

    const guards = await this.prisma.guardUser.findMany({
      where: { apartmentId: user.apartmentId, archive: false },
      select: { id: true, devices: { select: { fcmToken: true } } },
    });

    const tokens: string[] = guards.flatMap((guard) =>
      guard.devices.map((d) => d.fcmToken),
    );

    await this.notification.create(
      {
        type: 'guest',
        name: user.name,
        block: guest.flat.floor.block.name,
        flat: guest.flat.name,
        id: guest.id,
        provider: guest.name,
        path: `/preApprovedGuestDetails/${guest.id}`,
      },
      tokens,
      guards.map((g) => g.id),
    );

    return guest;
  }

  async createMultiGuest({
    body: { startDate, endDate, backgroundImage, guests, isOneDay },
    user,
  }: AssignedUserParam.Create<MultiGuestDto>) {
    // Compare with current date
    const currentDate = moment().startOf('day').toDate();
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj < currentDate || endDateObj < currentDate) {
      throw new BadRequestException(
        'Start date or end date cannot be in the past',
      );
    }

    if (startDateObj >= endDateObj)
      throw new BadRequestException(
        'Start date cannot be greater than or equal to end date',
      );

    const guards = await this.prisma.guardUser.findMany({
      where: { apartmentId: user.apartmentId, archive: false },
      select: { id: true, devices: { select: { fcmToken: true } } },
    });

    const tokens: string[] = guards.flatMap((guard) =>
      guard.devices.map((d) => d.fcmToken),
    );

    const createdGuests = await Promise.all(
      guests.map(async (guest) => {
        const contact = guest.contact;
        const visitor = await this.prisma.frequentVisitor.findUnique({
          where: {
            contact_clientId: {
              contact,
              clientId: user.id,
            },
          },
        });

        if (!visitor) {
          await this.prisma.frequentVisitor.create({
            data: {
              contact,
              clientId: user.id,
              count: 1,
            },
          });
        } else {
          await this.prisma.frequentVisitor.update({
            where: {
              id: visitor.id,
            },
            data: { count: { increment: 1 } },
          });
        }

        const multiguest = await this.prisma.guest.create({
          data: {
            ...guest,
            flatId: user.flatId,
            startDate,
            endDate,
            createdById: user.id,
            createdByType: user.currentState.type,
            isOneDay,
            gatePass: {
              create: {
                code: generateGatePassId(),
                backgroundImage,
                flatId: user.flatId,
                apartmentId: user.apartmentId,
              },
            },
          },
          include: {
            gatePass: {
              select: {
                id: true,
                code: true,
              },
            },
            flat: {
              select: {
                name: true,
                floor: { select: { block: { select: { name: true } } } },
                apartment: { select: { id: true } },
              },
            },
            createdBy: { select: { name: true } },
          },
        });

        await this.notification.create(
          {
            type: 'guest',
            name: user.name,
            block: multiguest.flat.floor.block.name,
            flat: multiguest.flat.name,
            id: multiguest.id,
            provider: guest.name,
            path: `/preApprovedGuestDetails/${multiguest.id}`,
          },
          tokens,
          guards.map((g) => g.id),
        );

        return multiguest;
      }),
    );

    return createdGuests;
  }

  async createMultiGuestOnePass({
    user,
    body: { startDate, endDate, backgroundImage, description, number },
  }: AssignedUserParam.Create<MultiGuestOnePassDto>) {
    // Compare with current date
    const currentDate = moment().startOf('day').toDate();
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj < currentDate || endDateObj < currentDate) {
      throw new BadRequestException(
        'Start date or end date cannot be in the past',
      );
    }

    if (startDateObj >= endDateObj)
      throw new BadRequestException(
        'Start date cannot be greater than or equal to end date',
      );

    const guest = await this.prisma.guestMass.create({
      data: {
        startDate,
        endDate,
        createdById: user.id,
        createdByType: user.currentState.type,
        flatId: user.flatId,
        total: number,
        description,
        gatePass: {
          create: {
            code: generateGatePassId(),
            backgroundImage,
            flatId: user.flatId,
            apartmentId: user.apartmentId,
          },
        },
      },
      include: {
        gatePass: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    return guest;
  }

  async getAllGuests({ user: { flatId } }: AssignedUserParam.GetAll) {
    const guests = await this.prisma.guest.findMany({
      where: {
        flatId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return guests;
  }

  async deleteGuest({ id, user }: AssignedUserParam.Delete) {
    const exists = await this.prisma.guest.findUnique({
      where: {
        id: id,
        flatId: user.flatId,
      },
    });

    if (!exists) {
      throw new NotFoundException('Guest not found');
    }

    const guest = await this.prisma.guest.delete({
      where: {
        id: id,
        flatId: user.flatId,
      },
    });

    return guest;
  }

  async getAllFrequentGuests({ user }: AssignedUserParam.GetAll) {
    const visitors = await this.prisma.frequentVisitor.findMany({
      where: {
        clientId: user.id,
        count: { gt: 2 },
      },
      select: {
        contact: true,
        clientId: true,
      },
      orderBy: {
        count: 'desc',
      },
      take: 5,
    });

    const result = await Promise.all(
      visitors.map(async (i) => {
        const user = await this.prisma.guest.findFirst({
          where: { contact: i.contact, createdById: i.clientId },
          select: { id: true, name: true, contact: true },
        });

        return user;
      }),
    );

    return result;
  }

  async getWhoInvited({ user }: AssignedUserParam.GetAll) {
    const result = await this.prisma.flat.findFirst({
      where: { id: user.flatId },
      select: {
        name: true,
        floor: {
          select: {
            name: true,
            block: {
              select: {
                name: true,
                apartment: {
                  select: { name: true, city: true, country: true },
                },
              },
            },
          },
        },
      },
    });

    const detail = await this.prisma.clientUser.findFirst({
      where: {
        id: user.id,
      },
      select: {
        name: true,
      },
    });

    return { client: detail?.name, ...result };
  }

  async share({ id, user }: AssignedUserParam.Get) {
    const result = await this.prisma.guestMass.findFirst({
      where: { id, createdBy: { id: user.id } },
      select: {
        id: true,
        createdBy: {
          select: { name: true },
        },
        description: true,
        flat: {
          select: {
            name: true,
            floor: {
              select: {
                name: true,
                block: {
                  select: {
                    name: true,
                    apartment: {
                      select: { name: true, city: true, country: true },
                    },
                  },
                },
              },
            },
          },
        },
        startDate: true,
        endDate: true,
        gatePass: {
          select: { code: true },
        },
      },
    });

    return result;
  }

  async deleteGuestMass({ id, user }: AssignedUserParam.Delete) {
    const exists = await this.prisma.guestMass.findUnique({
      where: {
        id: id,
        flatId: user.flatId,
      },
    });

    if (!exists) {
      throw new NotFoundException('Guest mass not found');
    }

    const guest = await this.prisma.guestMass.delete({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    return guest;
  }
}
