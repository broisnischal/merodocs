import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateParams, GetAllParams, GetParam } from '../../common/interface';
import { createServiceDto, createServiceTypeDto } from './dtos/index.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { CheckInOutLogService } from 'src/global/checkinout/checkinout.service';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly awsService: AWSStorageService,
    private readonly jsonService: CheckInOutLogService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async create(
    data: CreateParams<createServiceDto & { image: Express.Multer.File }>,
  ) {
    const { apartmentId, loggedUserData, postData } = data;

    const { flatId, contact, name, vehicleType, vehicleNo, serviceTypeId } =
      postData;

    const validProvider = await this.prisma.serviceType.findUnique({
      where: {
        id: serviceTypeId,
        OR: [{ forAll: true }, { apartmentId }],
      },
    });

    if (!validProvider) throw new NotFoundException('Service Type not found');

    const validFlat = await this.prisma.flat.findUnique({
      where: {
        id: flatId,
        apartmentId,
        archive: false,
        currentClients: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        apartment: { select: { name: true } },
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
    });

    if (!validFlat)
      throw new NotFoundException(
        'Invalid flats or Unassigned flat been selected.',
      );

    const parentJson = await this.jsonService.findParentUser(validFlat.id);

    const transaction = await this.prisma.$transaction(async (prisma) => {
      const service = await prisma.serviceUser.create({
        data: {
          serviceTypeId,
          name,
          fromDate: new Date(),
          flatId,
          contact,
          status: 'pending',
          type: 'manual',
        },
      });

      const image = await this.awsService.uploadToS3(postData.image);

      const flatJson = this.jsonService.createFlatJson(validFlat);

      const checkInOut = await prisma.checkInOut.create({
        data: {
          apartmentId,
          serviceId: service.id,
          type: 'checkin',
          requestType: 'service',
          createdByType: 'guard',
          createdByGuardId: loggedUserData.id,
          surveillanceId: loggedUserData.defaultSurveillanceId
            ? loggedUserData.defaultSurveillanceId
            : loggedUserData.surveillanceId,
          vehicleNo,
          vehicleType,
          image: image.url,
          flatJson,
          flats: {
            connect: {
              id: flatId,
            },
          },
          parentJson: parentJson ? parentJson : undefined,
          requests: {
            create: {
              type: 'checkin',
              status: 'pending',
              flatId,
            },
          },
        },
      });

      const clients = await this.prisma.clientUser.findMany({
        where: {
          currentFlats: {
            some: {
              flatId: validFlat.id,
              offline: false,
            },
          },
          offline: false,
          archive: false,
        },
        select: {
          id: true,
          devices: {
            select: {
              fcmToken: true,
            },
          },
        },
      });

      return { checkInOut, clients };
    });

    const tokens: string[] = transaction.clients
      .flatMap((client) => client.devices.map((device) => device.fcmToken))
      .filter((token) => token);

    await this.clientNotification.createMultipleNotification(
      {
        type: 'service',
        title: `Service - ${validProvider.name} | Block ${validFlat.floor.block.name},${validFlat.apartment.name}`,
        body: `${validProvider.name} is at the gate.Do you want to let in? Tap to take action.`,
        clickable: true,
        logo: 'service',
        path:
          ClientAppRouter.VISITOR_NOTIFICATION_SCREEN +
          `/${transaction.checkInOut.id}`,
        id: transaction.checkInOut.id,
        live: 'yes',
        sound: 'yes',
        flatId: validFlat.id,
      },
      tokens,
      transaction.clients.map((client) => client.id),
      false,
    );

    return transaction.checkInOut;
  }

  async getPreapproved(data: GetAllParams) {
    const { apartmentId, q } = data;

    const services = await this.prisma.serviceUser.findMany({
      where: {
        flat: {
          apartmentId,
          name: { contains: q?.toLowerCase(), mode: 'insensitive' },
        },
        type: 'preapproved',
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        flat: {
          select: {
            name: true,
            floor: {
              select: {
                name: true,
                block: { select: { name: true } },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            contact: true,
          },
        },
        createdByType: true,
      },
    });

    return services.map((i) => ({
      ...i,
      createdBy: {
        ...i.createdBy,
        type: i.createdByType,
      },
    }));
  }

  async getPreapprovedId(data: GetParam) {
    const { apartmentId, id } = data;

    const service = await this.prisma.serviceUser.findFirst({
      where: {
        id,
        flat: {
          apartmentId,
        },
        type: 'preapproved',
        status: 'pending',
      },
      select: {
        id: true,
        name: true,
        contact: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            contact: true,
          },
        },
        createdByType: true,
        fromDate: true,
        toDate: true,
        flat: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                name: true,
                block: { select: { name: true } },
              },
            },
          },
        },
        serviceType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!service) throw new NotFoundException('Service does not exist');

    const currentDate = new Date();
    const endDate = new Date(service.toDate!);

    const endDateNoon = new Date(endDate);
    endDateNoon.setHours(12, 0, 0, 0);

    const isAfterNoon = currentDate > endDateNoon;

    if (isAfterNoon) {
      return {
        warning: true,
        service: {
          ...service,
          createdBy: {
            ...service.createdBy,
            type: service.createdByType,
          },
        },
      };
    }

    return {
      warning: false,
      service: {
        ...service,
        createdBy: {
          ...service.createdBy,
          type: service.createdByType,
        },
      },
    };
  }

  async createServiceType(data: CreateParams<createServiceTypeDto>) {
    const { postData, apartmentId } = data;

    const { name } = postData;

    const unique = await this.prisma.serviceType.findFirst({
      where: { name, apartmentId },
    });

    if (unique) throw new ConflictException('Name already exist');

    const service = await this.prisma.serviceType.create({
      data: {
        name,
        apartmentId,
      },
    });

    return service;
  }
}
