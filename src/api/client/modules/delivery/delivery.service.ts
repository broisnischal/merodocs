import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDeliveryDto } from './dto/delivery.dto';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createDeliveryTypeDto } from './dto';
import { AssignedUserParam, GetAllParams } from '../../common/interfaces';
import { GuardNotificationService } from 'src/global/notification/guard-notification.service';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: GuardNotificationService,
  ) {}

  async getAlldelivery({ user: { flatId } }: AssignedUserParam.GetAll) {
    const results = await this.prisma.delivery.findMany({
      where: {
        flats: {
          some: {
            id: flatId,
          },
        },
      },
    });
    return results;
  }

  async searchDelivery({ user, q }: AssignedUserParam.GetAll) {
    const results = await this.prisma.serviceProvider.findMany({
      where: {
        type: 'delivery',
        name: {
          contains: q,
          mode: 'insensitive',
        },
        OR: [
          { forAll: true },
          { userId: user.id },
          { apartmentId: user.apartmentId },
        ],
      },
      include: {
        image: { select: { url: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return results;
  }

  async inviteDelivery({
    body,
    user,
  }: AssignedUserParam.Create<CreateDeliveryDto>) {
    const isDelivery = await this.prisma.serviceProvider.findUnique({
      where: {
        id: body.providerId,
        OR: [
          { forAll: true },
          { userId: user.id },
          { apartmentId: user.apartmentId },
        ],
      },
    });

    if (!isDelivery) {
      throw new NotFoundException('Provider not found');
    }

    if (isDelivery?.type !== 'delivery') {
      throw new BadRequestException('Not a delivery provider');
    }

    const detail = await this.prisma.flat.findFirst({
      where: { id: user.currentState.flatId },
      select: {
        name: true,
        floor: { select: { block: { select: { name: true } } } },
      },
    });

    const { providerId, ...rest } = body;

    const value = await this.prisma.delivery.create({
      data: {
        ...rest,
        serviceProviderId: providerId,
        ...(user.flatId && {
          flats: {
            connect: {
              id: user.flatId,
            },
          },
        }),
        createdById: user.id,
        createdByType: user.currentState.type,
      },
      include: {
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

    // value.leaveAtGate
    //   ? await this.notification.create(
    //       {
    //         type: 'parcel',
    //         name: user.name,
    //         providerType: isDelivery.name,
    //         block: detail?.floor.block.name,
    //         flat: detail?.name,
    //         id: value.id,
    //         path: `/parcelAtGateRoute`,
    //       },
    //       tokens,
    //       guards.map((g) => g.id),
    //     )
      // : 
      await this.notification.create(
          {
            type: 'delivery',
            name: user.name,
            block: detail?.floor.block.name,
            flat: detail?.name,
            providerType: isDelivery.name,
            id: value.id,
            path: `/preApprovedDeliveryDetails/${value.id}`,
          },
          tokens,
          guards.map((g) => g.id),
        );

    return value;
  }

  async cancel({ id, user }: AssignedUserParam.Delete) {
    const existDelivery = await this.prisma.delivery.findUnique({
      where: {
        id,
        flats: {
          some: {
            id: user.flatId,
          },
        },
      },
    });

    if (!existDelivery) {
      throw new NotFoundException('Delivery not found');
    }

    const deleted = await this.prisma.delivery.delete({
      where: {
        id,
      },
    });

    return deleted;
  }

  async getParcelPending({ user: { flatId } }: AssignedUserParam.GetAll) {
    const results = await this.prisma.checkInOutRequest.findMany({
      where: {
        type: 'parcel',
        flatId,
      },
      select: {
        id: true,
        isCollected: true,
        status: true,
        checkInOut: {
          select: {
            delivery: {
              select: {
                id: true,
                serviceProvider: {
                  select: {
                    id: true,
                    name: true,
                    image: { select: { url: true } },
                  },
                },
                images: true,
                name: true,
                contact: true,
              },
            },
            vehicleNo: true,
            vehicleType: true,
            image: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            createdAt: true,
          },
        },
        createdAt: true,
        approvedByGuard: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
      },
    });

    return results;
  }

  async getParcelById({ id, user }: AssignedUserParam.Get) {
    const checkin = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        flatId: user.flatId,
      },
      select: {
        status: true,
        checkInOut: {
          select: {
            delivery: {
              select: {
                id: true,
                serviceProvider: {
                  select: {
                    id: true,
                    name: true,
                    image: { select: { url: true } },
                  },
                },
                images: true,
                name: true,
                contact: true,
              },
            },
            vehicleNo: true,
            vehicleType: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            createdAt: true,
          },
        },
        createdAt: true,
        collectedByUser: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
        collectedByGuard: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
        approvedByGuard: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
        updatedAt: true,
      },
    });

    if (!checkin) throw new NotFoundException('Request doesnot exist');

    return checkin;
  }

  async updateParcelById({
    id,
    user: { flatId },
  }: AssignedUserParam.Update<undefined>) {
    const parcel = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        flatId,
        hasUserConfirmed: false,
      },
      include: {
        checkInOut: {
          select: {
            delivery: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!parcel) throw new NotFoundException('Parcel doesnot exist');

    const update = await this.prisma.checkInOutRequest.update({
      where: {
        id,
      },
      data: {
        hasUserConfirmed: true,
      },
    });

    return update;
  }

  async createDeliveryType({
    body,
    user,
  }: AssignedUserParam.Create<createDeliveryTypeDto>) {
    const unique = await this.prisma.serviceProvider.findFirst({
      where: {
        name: body.name,
        type: 'delivery',
        userId: user.id,
      },
    });

    if (unique) throw new ConflictException('Name already exist');

    const service = await this.prisma.serviceProvider.create({
      data: {
        name: body.name,
        type: 'delivery',
        userId: user.id,
      },
    });

    return service;
  }

  async getParcelHistory(
    data: GetAllParams & {
      start?: moment.Moment;
      end?: moment.Moment;
    },
  ) {
    const { flatId } = data;

    const page = Number(data.page) || 1;
    const limit = Number(data.limit) || 10;

    const logs = await this.prisma.parcelHistory.getAllPaginated(
      {
        page,
        limit,
      },
      {
        where: {
          request: { flatId, hasUserConfirmed: true },
          createdAt: {
            gte: data.start?.startOf('day').toDate(),
            lte: data.end?.endOf('day').toDate(),
          },
        },
        select: {
          id: true,
          status: true,
          request: {
            select: {
              id: true,
              collectedByUser: {
                select: {
                  id: true,
                  name: true,
                  image: { select: { url: true } },
                },
              },
              collectedByGuard: {
                select: {
                  id: true,
                  name: true,
                  image: { select: { url: true } },
                },
              },
              checkInOut: {
                select: {
                  delivery: {
                    select: {
                      name: true,
                      contact: true,
                      serviceProvider: {
                        select: {
                          name: true,
                          image: { select: { url: true } },
                        },
                      },
                      images: true,
                    },
                  },
                  image: true,
                  vehicleNo: true,
                  vehicleType: true,
                  surveillance: {
                    select: { name: true },
                  },
                  createdAt: true,
                },
              },
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    );

    return logs;
  }
}
