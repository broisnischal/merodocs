import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignedUserParam } from '../../common/interfaces';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { UpdateCheckInDto } from './dto/update-checkin.dto';
import { ClientNotificationEnum } from '@prisma/client';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { capitalize } from 'lodash';

@Injectable()
export class CheckInApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientNotificationService: ClientNotificationService,
  ) {}

  async getCheckInRequest({ id, user }: AssignedUserParam.Get) {
    const request = await this.prisma.checkInOutRequest.findFirst({
      where: {
        checkInOutId: id,
        flatId: user.flatId,
        type: {
          not: "checkout"
        },
        // type: 'checkin',
      },
      select: {
        id: true,

        flat: {
          select: {
            id: true,
            name: true,
            apartment: {
              select: {
                name: true,
                area: true,
              },
            },
            floor: {
              select: {
                name: true,
                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        requestApproved: {
          select: {
            id: true,
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        checkInOut: {
          select: {
            requestType: true,
            image: true,
            id: true,
            guest: {
              select: {
                name: true,
                contact: true,
                group: true,
                groupId: true,
              },
            },
            delivery: {
              select: {
                name: true,
                contact: true,
                serviceProvider: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
            ride: {
              select: {
                riderName: true,
                contact: true,
                serviceProvider: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
            service: {
              select: {
                name: true,
                contact: true,
                serviceType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Request does not exist');

    const groups = request.checkInOut.guest?.group
      ? await this.prisma.guest.findMany({
          where: {
            group: true,
            groupId: request.checkInOut.guest.groupId,
          },
          include: {
            checkInOuts: {
              take: 1,
              select: {
                image: true,
              },
            },
          },
        })
      : [];

    return {
      requestId: request.id,
      id: request.checkInOut.id,
      type: request.checkInOut.requestType,
      image: request.checkInOut.image,
      flat: request.flat,
      group: request.checkInOut.guest?.group ? true : false,
      groups,
      main: request.checkInOut.guest
        ? {
            ...request.checkInOut.guest,
            serviceProvider: null,
          }
        : request.checkInOut.delivery
          ? request.checkInOut.delivery
          : request.checkInOut.ride
            ? request.checkInOut.ride
            : {
                ...request.checkInOut.service,
                serviceProvider: request.checkInOut.service?.serviceType
                  ? request.checkInOut.service.serviceType
                  : null,
                serviceType: undefined,
              },
    };
  }

  async updateCheckInStatus({
    id,
    body,
    user,
  }: AssignedUserParam.Update<UpdateCheckInDto>) {
    const valid = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        type: 'checkin',
        flatId: user.flatId,
      },
      include: {
        approvedByUser: {
          select: {
            name: true,
          },
        },
        approvedByGuard: {
          select: {
            name: true,
          },
        },
        checkInOut: {
          include: {
            flats: true,
            guest: { select: { name: true } },
            delivery: {
              select: {
                name: true,
                serviceProvider: { select: { name: true } },
              },
            },
            service: {
              select: {
                name: true,
                serviceType: { select: { name: true } },
              },
            },
            ride: {
              select: {
                riderName: true,
                serviceProvider: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!valid) throw new NotFoundException('Request does not exist');

    if (valid.status === 'approved' || valid.status === 'rejected')
      throw new NotFoundException(
        `Request is already ${valid.status} by ${capitalize(
          valid.approvedByGuard?.name ||
            valid.approvedByUser?.name ||
            'someone',
        )}`,
      );

    if (valid.checkInOut.guestId) {
      await this.prisma.guest.update({
        where: { id: valid.checkInOut.guestId },
        data: { status: body.status },
      });
    }

    if (valid.checkInOut.serviceId) {
      await this.prisma.serviceUser.update({
        where: { id: valid.checkInOut.serviceId },
        data: { status: body.status },
      });
    }

    if (valid.checkInOut.rideId) {
      await this.prisma.ride.update({
        where: { id: valid.checkInOut.rideId },
        data: { status: body.status },
      });
    }

    if (valid.checkInOut.deliveryId) {
      await this.prisma.delivery.updateMany({
        where: { id: valid.checkInOut.deliveryId },
        data: {
          status: body.leaveAtGate === true ? valid.status : body.status,
          leaveAtGate: body.leaveAtGate === true,
        },
      });

      if (body.leaveAtGate) {
        await this.prisma.checkInOutRequest.updateMany({
          where: { id },
          data: {
            type: 'parcel',
            status: body.status,
            requestApprovedId: user.id,
            approvedByUserId: user.id,
            approvedByGuardId: valid.checkInOut.createdByGuardId,
            requestRejectedId: body.status === 'rejected' ? user.id : null,
            // hasGuardCheckedIn: true
          },
        });

        await this.prisma.parcelHistory.create({
          data: {
            requestId: id,
            status: 'confirmed',
          },
        });
      }
    }

    const clientUser = await this.prisma.clientUser.findUnique({
      where: { id: user.id },
      select: { image: { select: { url: true } } },
    });

    await this.prisma.checkInOutRequest.update({
      where: { id: valid.id },
      data: {
        status: body.status,
        requestApprovedId: user.id,
        approvedByUserId: user.id,
        requestRejectedId: body.status === 'rejected' ? user.id : null,
      },
    });

    if (valid.checkInOut.group) {
      await this.prisma.checkInOutRequest.updateMany({
        where: {
          checkInOut: {
            group: true,
            groupId: valid.checkInOut.groupId,
          },
        },
        data: {
          status: body.status,
          requestApprovedId: user.id,
          approvedByUserId: user.id,
          requestRejectedId: body.status === 'rejected' ? user.id : null,
        },
      });

      await this.prisma.guest.updateMany({
        where: {
          group: true,
          groupId: valid.checkInOut.groupId,
        },
        data: {
          status: body.status,
        },
      });
    }

    const clients = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: { flatId: valid.flatId },
        },
        id: {
          not: user.id,
        },
      },
      select: {
        id: true,
        devices: { select: { fcmToken: true } },
      },
    });

    let type: ClientNotificationEnum, title: string, bodyMessage: string;

    switch (valid.checkInOut.requestType) {
      case 'guest':
        type = 'guest';
        title = `Entry ${body.status} by ${user.name}`;
        bodyMessage =
          body.status === 'approved'
            ? `Guest - ${valid.checkInOut.guest?.name} will be arriving soon.`
            : `Guest - ${valid.checkInOut.guest?.name} entry is denied.`;
        break;

      case 'delivery':
        type = 'delivery';
        title = `Entry ${body.status} by ${user.name}`;
        bodyMessage =
          body.status === 'approved'
            ? `${valid.checkInOut.delivery?.name} from ${valid.checkInOut?.delivery?.serviceProvider?.name} will be arriving soon.`
            : `${valid.checkInOut.delivery?.name} from ${valid.checkInOut.delivery?.serviceProvider?.name} entry is denied.`;
        break;

      case 'ride':
        type = 'ride';
        title = `Entry ${body.status} by ${user.name}`;
        bodyMessage =
          body.status === 'approved'
            ? `${valid.checkInOut.ride?.riderName} from ${valid.checkInOut.ride?.serviceProvider?.name} will be arriving soon.`
            : `${valid.checkInOut.ride?.riderName} from ${valid.checkInOut.ride?.serviceProvider?.name} entry is denied.`;
        break;

      case 'service':
        type = 'service';
        title = `Entry ${body.status} by ${user.name}`;
        bodyMessage =
          body.status === 'approved'
            ? `${valid.checkInOut.service?.serviceType?.name} ${valid.checkInOut.service?.name} will be arriving soon.`
            : `${valid.checkInOut.service?.serviceType?.name} ${valid.checkInOut.service?.name} entry is denied.`;
        break;

      default:
        return null;
    }

    const tokens = clients
      .map((i) => i.devices.map((d) => d.fcmToken))
      .flat()
      .filter((token) => token);

    await this.clientNotificationService.createMultipleNotification(
      {
        type,
        title,
        body: bodyMessage,
        clickable: true,
        logo: body.status === 'approved' ? 'approved' : 'rejected',
        path: ClientAppRouter.VISITOR_SCREEN,
        id: valid.id,
        flatId: valid.flatId,
      },
      tokens,
      clients.map((client) => client.id),
    );

    return {
      message: `Entry ${body.status === 'approved' ? body.status : 'denied'} by`,
      name: user.name,
      image: clientUser?.image?.url,
    };
  }
}
