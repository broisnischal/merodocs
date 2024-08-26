import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../common/interface';
import { createDeliveryDto } from './dtos/create-delivery.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { updateParcelDto } from './dtos/update-parcel.dto';
import { createDeliveryTypeDto } from './dtos/create-type.dto';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { PrismaService } from 'src/global/prisma/prisma.service';
import moment from 'moment';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly awsService: AWSStorageService,
    private readonly clientNotification: ClientNotificationService,
    private readonly primsaService: PrismaService,
  ) {}

  async create(
    data: CreateParams<
      createDeliveryDto & {
        image: Express.Multer.File;
        images?: Express.Multer.File[];
      }
    >,
  ) {
    const { apartmentId, loggedUserData, postData } = data;

    const { flats, contact, name, vehicleType, vehicleNo, serviceProviderId } =
      postData;

    const validProvider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: serviceProviderId,
        OR: [{ forAll: true }, { apartmentId }],
      },
    });

    if (!validProvider) throw new NotFoundException('Provider not found');

    const validFlats = await this.prisma.flat.findMany({
      where: {
        id: {
          in: flats,
        },
        currentClients: {
          some: {},
        },
        apartmentId,
        archive: false,
      },
    });

    if (validFlats.length > 0 && validFlats.length !== flats.length)
      throw new BadRequestException(
        'Invalid flats or Unassigned flats been selected.',
      );

    const images:
      | {
          name: string;
          url: string;
          mimetype: string;
        }[]
      | undefined =
      postData.images &&
      (await this.awsService.uploadMultipleToS3(postData.images));

    const transaction = await this.prisma.$transaction(async (prisma) => {
      const delivery = await prisma.delivery.create({
        data: {
          type: 'manual',
          fromDate: new Date(),
          toDate: new Date(),
          flats: {
            connect: validFlats.map((flat) => ({ id: flat.id })),
          },
          images: images?.map((image) => image.url),
          contact,
          serviceProviderId,
          name,
        },
        include: {
          serviceProvider: {
            select: {
              name: true,
            },
          },
        },
      });

      const image = await this.awsService.uploadToS3(postData.image);

      const checkInOut = await prisma.checkInOut.create({
        data: {
          apartmentId,
          deliveryId: delivery.id,
          type: 'checkin',
          requestType: 'delivery',
          createdByType: 'guard',
          createdByGuardId: loggedUserData.id,
          surveillanceId: loggedUserData.defaultSurveillanceId
            ? loggedUserData.defaultSurveillanceId
            : loggedUserData.surveillanceId,
          vehicleNo,
          vehicleType,
          image: image.url,
          flats: {
            connect: validFlats.map((flat) => ({ id: flat.id })),
          },
          requests: {
            createMany: {
              data: flats.map((flat) => {
                return {
                  type: 'checkin',
                  status: 'pending',
                  flatId: flat,
                  approvedByGuardId: loggedUserData.id //! to check
                };
              }),
            },
          },
        },
      });

      return { checkInOut, delivery };
    });

    const requests = await this.prisma.checkInOutRequest.findMany({
      where: {
        checkInOutId: transaction.checkInOut.id,
      },
      select: {
        id: true,
        type: true,
        flatId: true,
        flat: {
          select: {
            name: true,
            apartment: { select: { name: true } },
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

    await Promise.all(
      requests.map(async (request) => {
        const clients = await this.prisma.clientUser.findMany({
          where: {
            currentFlats: {
              some: {
                flatId: request.flatId,
                offline: false,
              },
            },
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
            type: 'delivery',
            title: `Delivery - ${transaction.delivery.serviceProvider.name} | Block ${request.flat.floor.block.name} - ${request.flat.name}, ${request.flat.apartment.name}`,
            body: `${transaction.delivery.name} from ${transaction.delivery.serviceProvider.name} is at the gate. Do you want to let in? Tap to take action.`,
            clickable: true,
            logo: 'in',
            path:
              ClientAppRouter.VISITOR_NOTIFICATION_SCREEN +
              `/${transaction.checkInOut.id}`,
            id: request.id,
            live: 'yes',
            sound: 'yes',
            flatId: request.flatId,
          },
          tokens,
          clients.map((client) => client.id),
          false,
        );
      }),
    );

    return transaction.checkInOut;
  }

  async getWaitingApproval(data: GetAllParams) {
    const { apartmentId, id } = data;

    const delivery = await this.prisma.checkInOutRequest.findMany({
      where: {
        checkInOut: { apartmentId },
        checkInOutId: id,
        type: 'checkin',
      },
      select: {
        id: true,
        status: true,
        checkInOut: {
          select: {
            service: {
              select: { name: true, contact: true },
            },
            image: true,
            vehicleNo: true,
            vehicleType: true,
            flats: {
              select: {
                name: true,
                floor: { select: { block: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return delivery;
  }

  async getPreapprovedDeliveries(data: GetAllParams) {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        flats: {
          some: {
            name: { contains: data.q?.toLowerCase(), mode: 'insensitive' },
            apartmentId: data.apartmentId,
          },
        },
        status: 'pending',
        type: 'preapproved',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        serviceProvider: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
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
        createdByType: true,
        leaveAtGate: true,
        flats: {
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

    return deliveries;
  }

  async getById(data: GetParam) {
    const delivery = await this.prisma.delivery.findUnique({
      where: {
        id: data.id,
        flats: {
          every: {
            apartmentId: data.apartmentId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        fromDate: true,
        toDate: true,
        leaveAtGate: true,
        always: true,
        createdAt: true,
        serviceProvider: {
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
        createdBy: {
          select: {
            name: true,
            contact: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        createdByType: true,
        flats: {
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

    if (!delivery) throw new NotFoundException('Delivery not found');

    return delivery;
  }

  async getParcelById(data: GetParam) {
    const { id, apartmentId } = data;

    const results = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        flat: { apartmentId },
      },
      select: {
        checkInOut: {
          select: {
            image: true,
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
                createdByType: true,
              },
            },
            vehicleNo: true,
            vehicleType: true,
            surveillance: {
              select: {
                name: true,
              },
            },
          },
        },
        approvedByGuard: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
            contact: true,
          },
        },
        collectedByUser: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
            contact: true,
          },
        },
        collectedByGuard: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
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
        updatedAt: true,
      },
    });

    if (!results) throw new NotFoundException('Request not found');

    return results;
  }

  async handoverParcel(data: UpdateParams<updateParcelDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const { clientId } = postData;

    const parcel = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        flat: { apartmentId },
        isCollected: false,
      },
      select: {
        id: true,
        flatId: true,
        checkInOut: {
          select: {
            id: true,
            delivery: { select: { name: true } },
          },
        },
        flat: {
          select: {
            name: true,
            apartment: {
              select: { name: true },
            },
            floor: {
              select: {
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

    if (!parcel) throw new NotFoundException('Parcel doesnot exist');

    const validClient = await this.prisma.clientUser.findUnique({
      where: { id: clientId, flats: { some: { id: parcel.flatId } } },
    });

    if (!validClient) throw new NotFoundException('Client doesnot exist');

    const update = this.prisma.checkInOutRequest.update({
      where: { id },
      data: {
        collectedByUserId: clientId,
        handedByGuardId: loggedUserData.id,
        isCollected: true,
        hasGuardCheckedIn: true,
      },
    });

    await this.prisma.parcelHistory.updateMany({
      where: {
        requestId: id,
      },
      data: {
        status: 'collected',
      },
    });

    const clients = await this.prisma.clientUser.findMany({
      where: {
        flats: {
          some: {
            id: parcel.flatId,
          },
        },
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
        type: 'parcel',
        title: `Parcel Received - ${parcel.checkInOut.delivery?.name} | Block ${parcel.flat.floor.block.name} - ${parcel.flat.name}, ${parcel.flat.apartment.name}`,
        body: `${loggedUserData.name} (Security) has confirmed that ${validClient.name} collected the parcel. Tap to confirm.`,
        clickable: true,
        logo: 'in',
        path: ClientAppRouter.DEFAULT,
        id: parcel.id,
        flatId: parcel.flatId,
      },
      tokens,
      clients.map((client) => client.id),
    );

    return update;
  }

  async updateParcelImage(data: UpdateParams<Array<Express.Multer.File>>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const parcel = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        checkInOut: {
          apartmentId,
          delivery: { leaveAtGate: true },
        },
      },
      select: {
        flat: {
          select: {
            id: true,
            name: true,
            apartment: {
              select: { name: true },
            },
            floor: {
              select: {
                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        checkInOut: {
          select: {
            delivery: {
              select: { id: true, serviceProvider: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!parcel) throw new NotFoundException('Parcel does not exist');

    const deliveryId = parcel.checkInOut.delivery?.id;

    if (!deliveryId) throw new BadRequestException('Delivery does not exist');

    const surveillance = await this.prisma.surveillance.findUnique({
      where: { id: loggedUserData.surveillanceId },
      select: {
        name: true,
      },
    });

    const uploads = await this.awsService.uploadMultipleToS3(postData);

    await this.prisma.$transaction(async (prisma) => {
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          images: {
            push: uploads.map((item) => item.url),
          },
        },
      });

      await prisma.parcelHistory.create({
        data: {
          requestId: id,
          status: 'confirmed',
        },
      });

      await prisma.checkInOutRequest.update({
        where: { id },
        data: {
          hasGuardCheckedIn: true,
        },
      });
    });

    const clients = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: {
            flatId: parcel.flat.id,
          },
        },
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
        type: 'parcel',
        title: `Parcel Collected at Gate - ${parcel.checkInOut.delivery?.serviceProvider.name} | Block ${parcel.flat.floor.block.name} - ${parcel.flat.name}, ${parcel.flat.apartment.name}`,
        body: `${loggedUserData.name} from  ${surveillance?.name} has collected your parcel.`,
        clickable: true,
        logo: 'in',
        path: ClientAppRouter.DEFAULT,
        id,
        flatId: parcel.flat.id,
      },
      tokens,
      clients.map((client) => client.id),
    );

    return uploads.map((data) => data.url);
  }

  async getParcelPending(data: GetAllParams) {
    const { apartmentId } = data;
    const results = await this.prisma.checkInOutRequest.findMany({
      where: {
        type: 'parcel',
        checkInOut: {
          apartmentId,
        },
        isCollected: false,
      },
      select: {
        id: true,
        flat: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },

        checkInOut: {
          select: {
            id: true,
            delivery: {
              select: {
                id: true,
                name: true,
                contact: true,
                serviceProvider: {
                  select: {
                    id: true,
                    name: true,
                    image: { select: { url: true } },
                  },
                },
                images: true,
                createdByType: true,
              },
            },
            image: true,
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
        approvedByUser: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
            contact: true,
          },
        },
        createdAt: true,
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
        collectedByUser: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return results;
  }

  async createDeliveryType(data: CreateParams<createDeliveryTypeDto>) {
    const { postData, apartmentId } = data;

    const { name } = postData;

    const unique = await this.prisma.serviceProvider.findFirst({
      where: { name, type: 'delivery', apartmentId },
    });

    if (unique) throw new ConflictException('Name already exist');

    const service = await this.prisma.serviceProvider.create({
      data: {
        name,
        type: 'delivery',
        apartmentId,
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
    const { apartmentId } = data;

    const page = Number(data.page) || 1;
    const limit = Number(data.limit) || 10;

    const logs = await this.primsaService.parcelHistory.getAllPaginated(
      {
        page,
        limit,
      },
      {
        where: {
          request: { checkInOut: { apartmentId } },
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
              approvedByGuard: {
                select: {
                  id: true,
                  name: true,
                  image: { select: { url: true } },
                },
              },
              approvedByUser: {
                select: {
                  id: true,
                  name: true,
                  image: { select: { url: true } },
                },
              },
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
                  delivery: { select: { images: true } },
                  surveillance: {
                    select: { name: true },
                  },
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    );

    return logs;
  }
}
