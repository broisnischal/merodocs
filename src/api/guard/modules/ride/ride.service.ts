import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateParams, GetAllParams, GetParam } from '../../common/interface';
import { createRideDto } from './dtos/create-ride.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { CheckInOutLogService } from 'src/global/checkinout/checkinout.service';
import { createRideTypeDto } from './dtos/index.dto';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';

@Injectable()
export class RideService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly awsService: AWSStorageService,
    private readonly jsonService: CheckInOutLogService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async create(
    data: CreateParams<createRideDto & { image: Express.Multer.File }>,
  ) {
    const { apartmentId, loggedUserData, postData } = data;

    const { flatId, contact, name, vehicleType, vehicleNo, serviceProviderId } =
      postData;

    const validProvider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: serviceProviderId,
        OR: [{ forAll: true }, { apartmentId }],
      },
    });

    if (!validProvider) throw new NotFoundException('Provider not found');

    const validFat = await this.prisma.flat.findUnique({
      where: {
        id: flatId,
        apartmentId,
        archive: false,
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

    if (!validFat)
      throw new NotFoundException(
        'Invalid flats or Unassigned flat been selected.',
      );

    const parentJson = await this.jsonService.findParentUser(validFat.id);

    const checkInOut = await this.prisma.$transaction(async (prisma) => {
      const ride = await prisma.ride.create({
        data: {
          type: 'manual',
          fromDate: new Date(),
          toDate: new Date(),
          flatId,
          contact,
          serviceProviderId,
          riderName: name,
        },
        include: {
          flat: {
            select: {
              name: true,
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
        },
      });

      const image = await this.awsService.uploadToS3(postData.image);

      const flatJson = this.jsonService.createFlatJson(validFat);

      const checkInOut = await prisma.checkInOut.create({
        data: {
          apartmentId,
          rideId: ride.id,
          type: 'checkin',
          requestType: 'ride',
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

      return checkInOut;
    });

    const clients = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: {
            flatId: validFat.id,
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

    const tokens: string[] = clients
      .flatMap((client) => client.devices.map((device) => device.fcmToken))
      .filter((token) => token);

    await this.clientNotification.createMultipleNotification(
      {
        type: 'ride',
        title: `Ride Share - ${validProvider.name} | Block ${validFat.floor.block.name},${validFat.apartment.name}`,
        body: `${name} from ${validProvider.name} is at the gate.Do you want to let in? Tap to take action.`,
        clickable: true,
        logo: 'ride',
        path: ClientAppRouter.VISITOR_NOTIFICATION_SCREEN + `/${checkInOut.id}`,
        id: checkInOut.id,
        live: 'yes',
        sound: 'yes',
        flatId: validFat.id,
      },
      tokens,
      clients.map((client) => client.id),
      false,
    );

    return checkInOut;
  }

  async getPreapprovedRides(data: GetAllParams) {
    const rides = await this.prisma.ride.findMany({
      where: {
        flat: {
          name: { contains: data.q?.toLowerCase(), mode: 'insensitive' },
          apartmentId: data.apartmentId,
        },
        status: 'pending',
        type: 'preapproved',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        riderName: true,
        fromDate: true,
        toDate: true,
        contact: true,
        createdBy: {
          select: {
            name: true,
            contact: true,
          },
        },
        createdByType: true,
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
      },
    });

    return rides.map((i) => ({
      ...i,
      createdBy: {
        ...i.createdBy,
        type: i.createdByType,
      },
    }));
  }

  async getById(data: GetParam) {
    const ride = await this.prisma.ride.findUnique({
      where: {
        id: data.id,
        flat: {
          apartmentId: data.apartmentId,
        },
      },

      include: {
        serviceProvider: {
          select: {
            name: true,
          },
        },
        createdBy: {
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
      },
    });

    if (!ride) throw new NotFoundException('Ride not found');

    return {
      ...ride,
      createdBy: {
        ...ride.createdBy,
        type: ride.createdByType,
      },
    };
  }

  async createRideType(data: CreateParams<createRideTypeDto>) {
    const { postData, apartmentId } = data;

    const { name } = postData;

    const unique = await this.prisma.serviceProvider.findFirst({
      where: { name, type: 'ride', apartmentId },
    });

    if (unique) throw new ConflictException('Name already exist');

    const service = await this.prisma.serviceProvider.create({
      data: {
        name,
        type: 'ride',
        apartmentId,
      },
    });

    return service;
  }
}
