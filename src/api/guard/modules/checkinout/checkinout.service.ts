import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../common/interface';
import { createCheckInDto } from './dto/create-checkIn.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { checkInCodeDto } from './dto/checkin-code.dto';
import { createCheckInCodeDto } from './dto/create-checkIn-code.dto';
import { checkInQueryDto } from './dto/get-checkinlogs.dto';
import { ClockInOutService } from '../clockinout/clockinout.service';
import { checkOutVisitorsDto } from './dto/checkout-visitors.dto';
import { CheckInOutLogService } from 'src/global/checkinout/checkinout.service';
import { enumToArray } from 'src/common/utils';
import {
  CheckInOutRequestTypeEnum,
  ClientNotificationEnum,
} from '@prisma/client';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { UpdateCheckInDto } from './dto/update-checkin.dto';
import { formatDateTime } from 'src/common/utils/date';

@Injectable()
export class CheckInOutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
    private readonly clockInOutService: ClockInOutService,
    private readonly jsonService: CheckInOutLogService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async createCheckInOutForPreApproved(
    data: CreateParams<
      createCheckInDto & {
        image: Express.Multer.File;
        images?: Express.Multer.File[];
      }
    >,
  ) {
    const { loggedUserData, apartmentId } = data;
    const { type, typeId, vehicleType, vehicleno, name, contact } =
      data.postData;

    const image = await this.awsService.uploadToS3(data.postData.image);

    const surveillance = await this.prisma.surveillance.findFirst({
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    try {
      switch (type) {
        case 'delivery': {
          const delivery = await this.prisma.delivery.findUnique({
            where: {
              id: typeId,
              type: 'preapproved',
              flats: {
                some: { apartmentId },
              },
            },
            include: {
              flats: {
                select: {
                  id: true,
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
              serviceProvider: { select: { name: true } },
            },
          });

          if (!delivery) throw new NotFoundException('Delivery not found');

          let images:
            | {
                name: string;
                url: string;
                mimetype: string;
              }[]
            | undefined =
            data.postData.images &&
            (await this.awsService.uploadMultipleToS3(data.postData.images));

          const already = await this.prisma.checkInOut.findFirst({
            where: {
              apartmentId,
              requestType: type,
              deliveryId: typeId,
            },
          });

          if (already)
            throw new ConflictException('Already a delivery is in progress');

          await this.prisma.delivery.update({
            where: {
              id: typeId,
            },
            data: {
              contact,
              name,
              status: 'approved',
              images: images?.map((image) => image.url),
            },
          });

          const parentJsonDelivery = this.jsonService.createParentJSON({
            ...delivery.createdBy,
            type: delivery.createdByType,
          });

          const checkIn = await this.prisma.checkInOut.create({
            data: {
              type: 'checkin',
              apartmentId,
              deliveryId: typeId,
              requestType: type,
              vehicleType,
              vehicleNo: vehicleno,
              createdByUserId: delivery.createdById,
              createdByType: 'user',
              surveillanceId: loggedUserData.defaultSurveillanceId
                ? loggedUserData.defaultSurveillanceId
                : loggedUserData.surveillanceId,
              createdByGuardId: loggedUserData.id,
              image: image.url,
              parentJson: parentJsonDelivery,
              flats: {
                connect: delivery.flats.map((flat) => ({ id: flat.id })),
              },
              requests: {
                createMany: {
                  data: delivery.flats.map((flat) => {
                    return {
                      type: delivery.leaveAtGate ? 'parcel' : 'checkin',
                      status: 'approved',
                      approvedByGuardId: loggedUserData.id,
                      approvedByUserId: delivery.createdById,
                      flatId: flat.id,
                      hasGuardCheckedIn: true,
                    };
                  }),
                },
              },
            },
            include: {
              surveillance: { select: { name: true } },
            },
          });

          await this.updateGuardNotifications(
            loggedUserData,
            typeId.toString(),
          );

          if (delivery.leaveAtGate) {
            const requests = await this.prisma.checkInOutRequest.findMany({
              where: {
                checkInOutId: checkIn.id,
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

            for (const request of requests) {
              await this.prisma.parcelHistory.create({
                data: {
                  requestId: request.id,
                  status: 'confirmed',
                },
              });

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
                .flatMap((client) =>
                  client.devices.map((device) => device.fcmToken),
                )
                .filter((token) => token);

              await this.clientNotification.createMultipleNotification(
                {
                  type: 'parcel',
                  title: `Parcel Collected at Gate - ${delivery.serviceProvider.name} | Block ${request.flat.floor.block.name} - ${request.flat.name}, ${request.flat.apartment.name}`,
                  body: `${loggedUserData.name} from ${surveillance?.name} has collected your parcel.`,
                  id: checkIn.id,
                  clickable: true,
                  logo: 'in',
                  path: ClientAppRouter.DEFAULT,
                  flatId: request.flatId,
                },
                tokens,
                clients.map((client) => client.id),
              );
            }
          } else {
            const requests = await this.prisma.checkInOutRequest.findMany({
              where: {
                checkInOutId: checkIn.id,
              },
              select: {
                id: true,
                type: true,
                flatId: true,
                flat: {
                  select: {
                    id: true,
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

            for (const request of requests) {
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
                .flatMap((client) =>
                  client.devices.map((device) => device.fcmToken),
                )
                .filter((token) => token);

              await this.clientNotification.createMultipleNotification(
                {
                  type: 'delivery',
                  title: `Delivery - ${delivery.serviceProvider.name} | Block ${request.flat.floor.block.name} - ${request.flat.name}, ${request.flat.apartment.name}`,
                  body: `${loggedUserData.name} from ${delivery.serviceProvider?.name} has checked in to society from ${surveillance?.name} at ${formatDateTime(checkIn.createdAt)}.`,
                  id: checkIn.id,
                  clickable: true,
                  logo: 'in',
                  path: ClientAppRouter.DEFAULT,
                  flatId: request.flat.id,
                },
                tokens,
                clients.map((client) => client.id),
              );
            }
          }

          return checkIn;
        }

        case 'ride': {
          const ride = await this.prisma.ride.findUnique({
            where: {
              id: typeId,
              type: 'preapproved',

              flat: { apartmentId },
            },
            include: {
              flat: {
                select: {
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
              serviceProvider: {
                select: { name: true },
              },
            },
          });

          if (!ride) throw new NotFoundException('Ride not found');

          const alreadyRide = await this.prisma.checkInOut.findFirst({
            where: {
              apartmentId,
              requestType: type,
              rideId: typeId,
            },
          });

          if (alreadyRide)
            throw new ConflictException('Already a ride is in progress');

          await this.prisma.ride.update({
            where: {
              id: typeId,
            },
            data: {
              contact,
              status: 'approved',
              riderName: name,
            },
          });

          const flatJsonRide = this.jsonService.createFlatJson(ride.flat);
          const parentJsonRide = this.jsonService.createParentJSON({
            ...ride.createdBy,
            type: ride.createdByType,
          });

          const rideCheckIn = await this.prisma.checkInOut.create({
            data: {
              type: 'checkin',
              apartmentId,
              rideId: typeId,
              requestType: type,
              vehicleType,
              vehicleNo: vehicleno,
              createdByUserId: ride.createdById,
              createdByType: 'user',
              surveillanceId: loggedUserData.defaultSurveillanceId
                ? loggedUserData.defaultSurveillanceId
                : loggedUserData.surveillanceId,
              createdByGuardId: loggedUserData.id,
              image: image.url,
              flats: {
                connect: { id: ride.flatId },
              },
              flatJson: flatJsonRide,
              parentJson: parentJsonRide,
              requests: ride.flatId
                ? {
                    create: {
                      type: 'checkin',
                      status: 'approved',
                      approvedByGuardId: loggedUserData.id,
                      approvedByUserId: ride.createdById,
                      flatId: ride.flatId,
                      hasGuardCheckedIn: true,
                    },
                  }
                : undefined,
            },
            include: { requests: { select: { id: true } } },
          });

          await this.updateGuardNotifications(
            loggedUserData,
            typeId.toString(),
          );

          const rideClients = await this.prisma.clientUser.findMany({
            where: {
              archive: false,
              offline: false,
              currentFlats: {
                some: {
                  flatId: ride?.flatId,
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

          const tokens: string[] = rideClients
            .flatMap((client) =>
              client.devices.map((device) => device.fcmToken),
            )
            .filter((token) => token);

          await this.clientNotification.createMultipleNotification(
            {
              type: 'ride',
              logo: 'in',
              title: `Ride Share - ${ride.serviceProvider.name} | Block ${ride.flat.floor.block.name}-${ride.flat.name},${ride.flat.apartment.name}`,
              body: `${ride.riderName} from ${ride.serviceProvider.name} has checked in to society from ${surveillance?.name} at ${formatDateTime(rideCheckIn.createdAt)}.`,
              id: rideCheckIn.id,
              clickable: true,
              path: ClientAppRouter.DEFAULT,
              flatId: ride.flatId,
            },
            tokens,
            rideClients.map((client) => client.id),
          );

          return rideCheckIn;
        }

        case 'service': {
          const service = await this.prisma.serviceUser.findUnique({
            where: {
              id: typeId,
              type: 'preapproved',

              flat: { apartmentId },
            },
            include: {
              serviceType: {
                select: { name: true },
              },
              createdBy: {
                select: {
                  name: true,
                  contact: true,
                  image: { select: { url: true } },
                },
              },
              flat: {
                select: {
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
              },
            },
          });

          if (!service) throw new NotFoundException('Service not found');

          const unique = await this.prisma.checkInOut.findFirst({
            where: {
              apartmentId,
              requestType: type,
              serviceId: typeId,
            },
          });

          if (unique)
            throw new ConflictException('Already a service is in progress');

          const flatJsonService = this.jsonService.createFlatJson(service.flat);
          const parentJsonService = this.jsonService.createParentJSON({
            ...service.createdBy,
            type: service.createdByType,
          });

          await this.prisma.serviceUser.update({
            where: {
              id: typeId,
            },
            data: {
              contact,
              name,
              status: 'approved',
            },
          });

          const serviceCheckIn = await this.prisma.checkInOut.create({
            data: {
              type: 'checkin',
              requestType: type,
              createdByType: 'user',
              createdByGuardId: loggedUserData.id,
              createdByUserId: service.createdById,
              flats: {
                connect: { id: service.flatId },
              },
              surveillanceId: loggedUserData.defaultSurveillanceId
                ? loggedUserData.defaultSurveillanceId
                : loggedUserData.surveillanceId,
              vehicleNo: vehicleno,
              vehicleType,
              image: image.url,
              serviceId: typeId,
              apartmentId,
              flatJson: flatJsonService,
              parentJson: parentJsonService,
              requests: service.flatId
                ? {
                    create: {
                      type: 'checkin',
                      status: 'approved',
                      approvedByGuardId: loggedUserData.id,
                      approvedByUserId: service.createdById,
                      flatId: service.flatId,
                      hasGuardCheckedIn: true,
                    },
                  }
                : undefined,
            },
            include: { requests: { select: { id: true } } },
          });

          await this.updateGuardNotifications(
            loggedUserData,
            typeId.toString(),
          );

          const serviceClients = await this.prisma.clientUser.findMany({
            where: {
              archive: false,
              offline: false,
              currentFlats: {
                some: {
                  flatId: service?.flatId,
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

          const tokens: string[] = serviceClients
            .flatMap((client) =>
              client.devices.map((device) => device.fcmToken),
            )
            .filter((token) => token);

          await this.clientNotification.createMultipleNotification(
            {
              type: 'service',
              logo: 'in',
              title: `Service - ${service.serviceType.name} | Block ${service.flat.floor.block.name}-${service.flat.name},${service.flat.apartment.name}`,
              body: `${service.name} from ${service.serviceType.name} has checked in to society from ${surveillance?.name} at ${formatDateTime(serviceCheckIn.createdAt)}.`,
              id: serviceCheckIn.id,
              clickable: true,
              path: ClientAppRouter.DEFAULT,
              flatId: service.flatId,
            },
            tokens,
            serviceClients.map((client) => client.id),
          );

          return serviceCheckIn;
        }

        case 'guest': {
          const guest = await this.prisma.guest.findUnique({
            where: {
              id: typeId,
              type: 'preapproved',
              flat: { apartmentId },
            },
            include: {
              flat: {
                select: {
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
              },
              createdBy: {
                select: {
                  name: true,
                  contact: true,
                  image: { select: { url: true } },
                },
              },
            },
          });

          if (!guest) throw new NotFoundException('Guest not found');

          const guardAlready = await this.prisma.checkInOut.findFirst({
            where: {
              apartmentId,
              requestType: type,
              serviceId: typeId,
            },
          });

          if (guardAlready)
            throw new ConflictException('Already a guest is in progress');

          await this.prisma.guest.update({
            where: {
              id: guest.id,
            },
            data: {
              status: 'approved',
              contact,
              name,
            },
          });

          const flatJson = this.jsonService.createFlatJson(guest.flat);
          const parentJsonGuest = this.jsonService.createParentJSON({
            ...guest.createdBy,
            type: guest.createdByType,
          });

          const guestCheckIn = await this.prisma.checkInOut.create({
            data: {
              type: 'checkin',
              requestType: 'guest',
              createdByType: 'user',
              createdByGuardId: loggedUserData.id,
              createdByUserId: guest.createdById,
              surveillanceId: loggedUserData.defaultSurveillanceId
                ? loggedUserData.defaultSurveillanceId
                : loggedUserData.surveillanceId,
              vehicleNo: vehicleno,
              vehicleType,
              image: image.url,
              guestId: guest.id,
              apartmentId,
              flats: {
                connect: { id: guest.flatId },
              },
              flatJson,
              parentJson: parentJsonGuest,
              requests: {
                create: {
                  type: 'checkin',
                  status: 'approved',
                  approvedByUserId: guest.createdById,
                  approvedByGuardId: loggedUserData.id,
                  flatId: guest.flatId,
                  hasGuardCheckedIn: true,
                },
              },
            },
            include: { requests: { select: { id: true } } },
          });

          await this.prisma.gatePass.update({
            where: {
              guestId: guest.id,
            },
            data: {
              expired: true,
            },
          });

          const guestClients = await this.prisma.clientUser.findMany({
            where: {
              archive: false,
              offline: false,
              currentFlats: {
                some: {
                  flatId: guest?.flatId,
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

          await this.updateGuardNotifications(
            loggedUserData,
            typeId.toString(),
          );

          const tokens: string[] = guestClients
            .flatMap((client) =>
              client.devices.map((device) => device.fcmToken),
            )
            .filter((token) => token);

          await this.clientNotification.createMultipleNotification(
            {
              type: 'guest',
              logo: 'in',
              title: `Guest - ${guest.name} | Block ${guest.flat.floor.block.name}-${guest.flat.name},${guest.flat.apartment.name}`,
              body: `has checked in to ${guest.name} from ${surveillance?.name} at ${formatDateTime(guestCheckIn.createdAt)}.`,
              id: guestCheckIn.id,
              clickable: true,
              path: ClientAppRouter.DEFAULT,
              flatId: guest.flatId,
            },
            tokens,
            guestClients.map((client) => client.id),
          );

          return guestCheckIn;
        }

        default:
          throw new NotFoundException('Invalid request type');
      }
    } catch (error) {
      await this.awsService.deleteFromS3(image.url);
      if (error instanceof HttpException) throw error;
    }
  }

  async getCheckInByCode(data: CreateParams<checkInCodeDto>) {
    const { apartmentId, postData } = data;

    const { code } = postData;

    const valid = await this.prisma.gatePass.findFirst({
      where: {
        code,
        apartmentId,
        expired: false,
      },
      select: {
        clientUser: {
          select: {
            id: true,
            image: { select: { url: true } },
            contact: true,
            name: true,
          },
        },
        flatId: true,
        clientStaff: {
          select: {
            id: true,
            image: { select: { url: true } },
            contact: true,
            name: true,
            personalStaffRole: {
              select: {
                name: true,
              },
            },
            flats: {
              select: {
                name: true,
                floor: {
                  select: { name: true, block: { select: { name: true } } },
                },
              },
            },
          },
        },
        adminService: {
          select: {
            id: true,
            image: { select: { url: true } },
            contact: true,
            shift: { select: { name: true } },
            role: { select: { name: true } },
          },
        },
        flat: {
          select: {
            name: true,
            floor: {
              select: { name: true, block: { select: { name: true } } },
            },
          },
        },
        guests: {
          select: {
            id: true,
            name: true,
            contact: true,
            createdBy: {
              select: {
                name: true,
                contact: true,
              },
            },
            createdByType: true,
            startDate: true,
            endDate: true,
            flat: {
              select: {
                name: true,
                floor: {
                  select: { name: true, block: { select: { name: true } } },
                },
              },
            },
          },
        },
        guestMass: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            createdByType: true,
            createdBy: {
              select: {
                name: true,
                contact: true,
                image: {
                  select: { url: true },
                },
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
            total: true,
            entered: true,
          },
        },
      },
    });

    if (!valid)
      throw new NotFoundException(
        'There is no account found with the following code. Please try again.',
      );

    if (valid.guests) {
      const currentDate = new Date();
      const endDate = new Date(valid.guests!.endDate!);

      const endDateNoon = new Date(endDate);
      endDateNoon.setHours(12, 0, 0, 0);

      // Check if the current date is after the end date at 12:00 PM
      const isAfterNoon = currentDate > endDateNoon;

      if (isAfterNoon) {
        return { warning: true, ...valid, flat: null };
      }

      return { warning: false, ...valid, flat: null };
    }

    if (valid.guestMass) {
      const currentDate = new Date();
      const endDate = new Date(valid.guestMass.endDate!);

      const endDateNoon = new Date(endDate);
      endDateNoon.setHours(12, 0, 0, 0);

      // Check if the current date is after the end date at 12:00 PM
      const isAfterNoon = currentDate > endDateNoon;

      if (isAfterNoon) {
        return { warning: true, ...valid, flat: null };
      }

      return { warning: false, ...valid, flat: null };
    }

    if (valid.clientStaff) {
      return { ...valid, flat: null };
    }

    return valid;
  }

  async createCheckInOutByCode(
    data: CreateParams<createCheckInCodeDto & { image?: Express.Multer.File }>,
  ) {
    const { loggedUserData, apartmentId } = data;
    const { flats, id, type } = data.postData;

    const surveillance = await this.prisma.surveillance.findFirst({
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    switch (type) {
      case 'adminservice':
        const serviceStaff = await this.prisma.adminService.exists(
          apartmentId,
          {
            where: {
              id,
            },
          },
        );

        if (!serviceStaff)
          throw new NotFoundException('Service Staff not found');

        await this.clockInOutService.clockInOutAdminService({
          apartmentId,
          id,
          loggedUserData,
          in: true,
        });

        return await this.prisma.checkInOut.create({
          data: {
            type: 'checkin',
            apartmentId,
            adminserviceId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
          },
        });

      case 'client':
        const clientUser = await this.prisma.clientUser.findUnique({
          where: {
            id,
            currentFlats: {
              some: {
                flat: {
                  apartmentId,
                },
              },
            },
          },
          include: {
            currentFlats: {
              select: {
                apartmentId: true,
                type: true,
                hasOwner: true,
                flat: {
                  select: {
                    id: true,
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
            },
          },
        });

        if (!clientUser) throw new NotFoundException('Client User not found');

        clientUser.currentFlats = clientUser.currentFlats.filter(
          (i) => i.apartmentId === loggedUserData.apartmentId,
        );

        const flatsArrayJson: any[] = [];

        const parentJson = clientUser.currentFlats[0];

        await Promise.all(
          clientUser.currentFlats.map(async (i) => {
            if (i?.type === 'tenant' && i?.hasOwner === true) {
              const result = await this.prisma.flatCurrentClient.findFirst({
                where: {
                  flatId: i.flat.id,
                  type: 'owner',
                },
                select: {
                  type: true,
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
                  clientUser: {
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
                },
              });
              flatsArrayJson.push(result);
            }

            if (i?.type === 'tenant' && i?.hasOwner === false) {
              const result = await this.prisma.flatCurrentClient.findFirst({
                where: {
                  flatId: i.flat.id,
                  type: 'tenant',
                },
                select: {
                  type: true,
                  residing: true,
                  offline: true,
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
                  clientUser: {
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
                },
              });
              flatsArrayJson.push(result);
            }

            if (i?.type === 'tenant_family') {
              const result = await this.prisma.flatCurrentClient.findFirst({
                where: {
                  flatId: i.flat.id,
                  type: 'tenant',
                },
                select: {
                  type: true,
                  residing: true,
                  offline: true,
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
                  clientUser: {
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
                },
              });
              flatsArrayJson.push(result);
            }

            if (i?.type === 'owner_family') {
              const result = await this.prisma.flatCurrentClient.findFirst({
                where: {
                  flatId: i.flat.id,
                  type: 'owner',
                },
                select: {
                  type: true,
                  residing: true,
                  offline: true,
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
                  clientUser: {
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
                },
              });
              flatsArrayJson.push(result);
            }
          }),
        );

        if (!clientUser) throw new NotFoundException('Client User not found');

        return await this.prisma.checkInOut.create({
          data: {
            type: 'checkin',
            apartmentId,
            clientId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flatArrayJson: {
              flats: flatsArrayJson.filter((i) => i),
            },
            parentJson,
          },
        });

      case 'clientstaff':
        const clientStaff = await this.prisma.clientStaff.exists(apartmentId, {
          where: {
            id,
          },
          include: {
            personalStaffRole: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!clientStaff) throw new NotFoundException('Client Staff not found');

        const validFlats = await this.prisma.flat.existMany(apartmentId, {
          where: {
            id: {
              in: flats,
            },
            clientStaffs: {
              some: {
                id,
              },
            },
          },
          select: {
            id: true,
            name: true,
            apartment: {
              select: {
                name: true,
              },
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
        });

        if (validFlats.length !== flats?.length)
          throw new NotFoundException('Some Invalid Flats sent');

        await this.clockInOutService.clockInOutClientStaff({
          apartmentId,
          id,
          loggedUserData,
          in: true,
        });

        const clientStaffCheckIn = await this.prisma.checkInOut.create({
          data: {
            type: 'checkin',
            apartmentId,
            clientStaffId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flats: {
              connect: flats.map((flat) => ({ id: flat })),
            },
            flatName: {
              set: validFlats.map((flat) => flat.name),
            },
          },
          include: {
            surveillance: {
              select: {
                name: true,
              },
            },
          },
        });

        for (const flat of validFlats) {
          const clients = await this.prisma.clientUser.findMany({
            where: {
              currentFlats: {
                some: {
                  flatId: flat.id,
                  offline: false,
                },
              },
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
            .flatMap((client) =>
              client.devices.map((device) => device.fcmToken),
            )
            .filter((token) => token);

          await this.clientNotification.createMultipleNotification(
            {
              type: 'clientstaff',
              title: `${clientStaff?.personalStaffRole?.name} - ${clientStaff.name} | Block ${flat.floor.block.name} - ${flat.name}, ${flat.apartment.name}`,
              body: `has checked in to society from ${clientStaffCheckIn?.surveillance?.name} at ${formatDateTime(clientStaffCheckIn.createdAt)}.`,
              id: clientStaffCheckIn.id,
              clickable: true,
              path: ClientAppRouter.DEFAULT,
              flatId: flat.id,
            },
            tokens,
            clients.map((client) => client.id),
          );
        }

        return clientStaffCheckIn;

      case 'guest':
        if (!data.postData.image)
          throw new BadRequestException('Image is required');

        const guest = await this.prisma.guest.exists(apartmentId, {
          where: {
            id,
          },
          include: {
            flat: {
              select: {
                name: true,
                apartment: {
                  select: {
                    name: true,
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
            createdBy: {
              select: {
                name: true,
                contact: true,
                image: { select: { url: true } },
              },
            },
          },
        });

        if (!guest) throw new NotFoundException('Guest not found');

        const image = await this.awsService.uploadToS3(data.postData.image);

        const flatJson = this.jsonService.createFlatJson(guest.flat);
        const parentJsonGuest = this.jsonService.createParentJSON({
          ...guest.createdBy,
          type: guest.createdByType,
        });

        const clients = await this.prisma.clientUser.findMany({
          where: {
            currentFlats: {
              some: {
                flatId: guest.flatId,
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

        const guestCheckIn = await this.prisma.checkInOut.create({
          data: {
            type: 'checkin',
            apartmentId,
            guestId: id,
            requestType: type,
            createdByType: 'user',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            image: image.url,
            requests: {
              create: {
                type: 'checkin',
                status: 'approved',
                approvedByGuardId: loggedUserData.id,
                approvedByUserId: guest.createdById,
                hasGuardCheckedIn: true,
                flatId: guest.flatId,
              },
            },
            flatJson,
            parentJson: parentJsonGuest,
          },
        });

        const tokens: string[] = clients
          .flatMap((client) => client.devices.map((device) => device.fcmToken))
          .filter((token) => token);

        await this.clientNotification.createMultipleNotification(
          {
            type: 'guest',
            title: `Guest - ${guest.name} | Block ${guest.flat.floor.block.name},${guest.flat.apartment.name}`,
            body: `has checked in to society from ${surveillance?.name} at ${formatDateTime(guestCheckIn.createdAt)}`,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            id: guestCheckIn.id,
            flatId: guest.flatId,
          },
          tokens,
          clients.map((client) => client.id),
        );

      default:
        throw new NotFoundException('Invalid request type');
    }
  }

  async getAllVisitorLogs(data: GetAllParams<checkInQueryDto>) {
    const { apartmentId, extended } = data;
    const page = Number(extended?.page) || 1;
    const limit = Number(extended?.limit) || 10;

    const logStart = extended?.start?.toDate();
    const logEnd = extended?.end?.toDate();

    const firstLog = await this.prisma.checkInOut.findFirst({
      where: {
        apartmentId,
        requestType: extended?.requestType,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const lastLog = await this.prisma.checkInOut.findFirst({
      where: {
        apartmentId,
        requestType: extended?.requestType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastLog || !firstLog) return { docs: undefined, data: [] };

    const start = logStart
      ? logStart < firstLog.createdAt
        ? firstLog.createdAt
        : logStart
      : firstLog.createdAt;

    const end = logEnd
      ? logEnd > lastLog.createdAt
        ? lastLog.createdAt
        : logEnd
      : lastLog.createdAt;

    if (
      !extended?.requestType ||
      !enumToArray(CheckInOutRequestTypeEnum).includes(extended.requestType)
    )
      throw new BadRequestException('Invalid request type');

    if (extended.requestType === 'guest') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
            OR: [
              {
                type: 'checkout',
              },
              {
                type: 'checkin',
                requests: {
                  some: {
                    status: 'approved',
                    hasGuardCheckedIn: true,
                  },
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            vehicleNo: true,
            vehicleType: true,
            image: true,
            flats: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            guest: {
              select: {
                name: true,
                type: true,
                contact: true,
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdByUser: {
              select: {
                name: true,
              },
            },
            requests: {
              select: {
                id: true,
                type: true,
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
                status: true,
                approvedByGuardId: true,
                approvedByUserId: true,
                flatId: true,
                updatedAt: true,
                createdAt: true,
              },
            },
            createdAt: true,
            updatedAt: true,
            createdByType: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'ride') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
            OR: [
              {
                type: 'checkout',
              },
              {
                type: 'checkin',
                requests: {
                  some: {
                    status: 'approved',
                    hasGuardCheckedIn: true,
                  },
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            vehicleNo: true,
            vehicleType: true,
            image: true,
            flats: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            ride: {
              select: {
                riderName: true,
                type: true,
                contact: true,
                serviceProvider: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdByUser: {
              select: {
                name: true,
              },
            },
            requests: {
              select: {
                id: true,
                type: true,
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
                status: true,
                approvedByGuardId: true,
                approvedByUserId: true,
                flatId: true,
                updatedAt: true,
                createdAt: true,
              },
            },
            createdAt: true,
            updatedAt: true,
            createdByType: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'delivery') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
            OR: [
              {
                type: 'checkout',
              },
              {
                type: 'checkin',
                requests: {
                  some: {
                    status: 'approved',
                    hasGuardCheckedIn: true,
                  },
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            vehicleNo: true,
            vehicleType: true,
            image: true,
            flats: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            delivery: {
              select: {
                name: true,
                type: true,
                contact: true,
                serviceProvider: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdByUser: {
              select: {
                name: true,
              },
            },
            requests: {
              select: {
                id: true,
                type: true,
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
                status: true,
                approvedByGuardId: true,
                approvedByUserId: true,
                flatId: true,
                updatedAt: true,
                createdAt: true,
              },
            },
            createdAt: true,
            updatedAt: true,
            createdByType: true,
          },
        },
      );
      return logs;
    } else if (extended.requestType === 'service') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
            OR: [
              {
                type: 'checkout',
              },
              {
                type: 'checkin',
                requests: {
                  some: {
                    status: 'approved',
                    hasGuardCheckedIn: true,
                  },
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            vehicleNo: true,
            vehicleType: true,
            image: true,
            flats: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
                type: true,
                contact: true,
                serviceType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdByUser: {
              select: {
                name: true,
              },
            },
            requests: {
              select: {
                id: true,
                type: true,
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
                status: true,
                approvedByGuardId: true,
                approvedByUserId: true,
                flatId: true,
                updatedAt: true,
                createdAt: true,
              },
            },
            createdAt: true,
            updatedAt: true,
            createdByType: true,
          },
        },
      );
      return logs;
    } else if (extended.requestType === 'clientstaff') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            vehicleNo: true,
            vehicleType: true,
            flats: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            clientStaff: {
              select: {
                name: true,
                contact: true,
                image: {
                  select: {
                    url: true,
                  },
                },
                personalStaffRole: {
                  select: {
                    name: true,
                  },
                },
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
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'adminservice') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            vehicleNo: true,
            vehicleType: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            parentJson: true,
            adminService: {
              select: {
                name: true,
                contact: true,
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
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'client') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
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
            parentJson: true,
            flatArrayJson: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            client: {
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
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'group') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            image: true,
            entered: true,
            vehicleNo: true,
            vehicleType: true,
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
            parentJson: true,
            flatArrayJson: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            groupEntry: {
              select: {
                id: true,
                contact: true,
                description: true,
                name: true,
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'guestmass') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
            OR: [
              {
                type: 'checkout',
              },
              {
                type: 'checkin',
                requests: {
                  some: {
                    status: 'approved',
                    hasGuardCheckedIn: true,
                  },
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            image: true,
            entered: true,
            vehicleNo: true,
            vehicleType: true,
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
            parentJson: true,
            flatArrayJson: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            guestMass: {
              select: {
                id: true,
                description: true,
                entered: true,
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
                total: true,
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      );

      return logs;
    } else if (extended.requestType === 'vehicle') {
      const logs = await this.prisma.checkInOut.getAllPaginatedById(
        {
          page,
          limit,
          apartmentId,
        },
        {
          where: {
            requestType: extended.requestType,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            requestType: true,
            image: true,
            entered: true,
            vehicleNo: true,
            vehicleType: true,
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
            parentJson: true,
            flatArrayJson: true,
            surveillance: {
              select: {
                name: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                contact: true,
                name: true,
                vehicleNumber: true,
                vehicle: {
                  select: {
                    image: {
                      select: {
                        name: true,
                        url: true,
                      },
                    },
                  },
                },
              },
            },
            createdByGuard: {
              select: {
                name: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
      );

      return logs;
    } else {
      throw new NotFoundException('Invalid request type');
    }
  }

  async createCheckOut(data: CreateParams<checkOutVisitorsDto>) {
    const { loggedUserData, apartmentId } = data;
    const { id, type } = data.postData;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const surveillance = await this.prisma.surveillance.findFirst({
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    switch (type) {
      case 'guest': {
        const guest = await this.prisma.guest.findFirst({
          where: {
            id,
            flat: {
              apartmentId,
            },
          },
          include: {
            flat: {
              select: {
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
            },
          },
        });

        if (!guest) throw new NotFoundException('Guest not found');

        const lastGuestRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              guestId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastGuestRequest || lastGuestRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        const guestCheckOut = await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            guestId: id,
            requestType: type,
            createdByType: 'user',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flatJson: lastGuestRequest?.flatJson ?? {},
            parentJson: lastGuestRequest?.parentJson ?? {},
            flats: {
              connect: {
                id: guest.flatId,
              },
            },
            image: lastGuestRequest?.image,
          },
        });

        const guestClients = await this.prisma.clientUser.findMany({
          where: {
            archive: false,
            offline: false,
            currentFlats: {
              some: {
                flatId: guest.flatId,
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

        const tokens: string[] = guestClients
          .flatMap((client) => client.devices.map((device) => device.fcmToken))
          .filter((token) => token);

        await this.clientNotification.createMultipleNotification(
          {
            type: 'guest',
            logo: 'out',
            title: `Guest - ${guest.name} | Block ${guest.flat.floor.block.name}-${guest.flat.name},${guest.flat.apartment.name}`,
            body: `has checked out from ${surveillance?.name} at ${formatDateTime(guestCheckOut.createdAt)}.`,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            id: guestCheckOut.id,
            flatId: guest.flatId,
          },
          tokens,
          guestClients.map((client) => client.id),
        );

        return guestCheckOut;
      }

      case 'clientstaff': {
        const clientStaff = await this.prisma.clientStaff.exists(apartmentId, {
          where: {
            id,
          },
          include: {
            personalStaffRole: {
              select: {
                name: true,
              },
            },
            flats: {
              select: {
                id: true,
                name: true,
                apartment: {
                  select: {
                    name: true,
                  },
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

        if (!clientStaff) throw new NotFoundException('Client Staff not found');

        const lastClientStaffRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              clientStaffId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (
          !lastClientStaffRequest ||
          lastClientStaffRequest.type === 'checkout'
        )
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        await this.clockInOutService.clockInOutClientStaff({
          apartmentId,
          id,
          loggedUserData,
          in: false,
        });

        const clientStaffCheckOut = await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            clientStaffId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flatName: lastClientStaffRequest?.flatName,
            parentJson: lastClientStaffRequest?.parentJson ?? {},
            flatArrayJson: lastClientStaffRequest?.flatArrayJson ?? {},
            flats: {
              connect: clientStaff.flats.map((flat) => ({ id: flat.id })),
            },
          },
          include: {
            surveillance: {
              select: {
                name: true,
              },
            },
          },
        });

        for (const flat of clientStaff.flats) {
          const clients = await this.prisma.clientUser.findMany({
            where: {
              currentFlats: {
                some: {
                  flatId: flat.id,
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
            .flatMap((client) =>
              client.devices.map((device) => device.fcmToken),
            )
            .filter((token) => token);

          await this.clientNotification.createMultipleNotification(
            {
              type: 'clientstaff',
              title: `${clientStaff?.personalStaffRole?.name} - ${clientStaff.name} | Block ${flat.floor.block.name} - ${flat.name}, ${flat.apartment.name}`,
              body: `has checked out to society from ${clientStaffCheckOut?.surveillance?.name} at ${formatDateTime(clientStaffCheckOut.createdAt)}.`,
              logo: 'out',
              clickable: true,
              path: ClientAppRouter.DEFAULT,
              id: clientStaffCheckOut.id,
              flatId: flat.id,
            },
            tokens,
            clients.map((client) => client.id),
          );
        }

        return clientStaffCheckOut;
      }

      case 'adminservice': {
        const adminService = await this.prisma.adminService.exists(
          apartmentId,
          {
            where: {
              id,
            },
          },
        );

        if (!adminService)
          throw new NotFoundException('Service Staff not found');

        const lastAdminServiceRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              adminserviceId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (
          !lastAdminServiceRequest ||
          lastAdminServiceRequest.type === 'checkout'
        )
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        await this.clockInOutService.clockInOutAdminService({
          apartmentId,
          id,
          loggedUserData,
          in: false,
        });

        return await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            adminserviceId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
          },
        });
      }

      case 'client': {
        const clientUser = await this.prisma.clientUser.findFirst({
          where: {
            id,
            currentFlats: {
              some: {
                apartmentId,
              },
            },
          },
        });

        if (!clientUser) throw new NotFoundException('Client User not found');

        const lastCLientRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              clientId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastCLientRequest || lastCLientRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        return await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            clientId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            parentJson: lastCLientRequest?.parentJson ?? {},
            flatArrayJson: lastCLientRequest?.flatArrayJson ?? {},
          },
        });
      }

      case 'delivery': {
        const delivery = await this.prisma.delivery.findFirst({
          where: {
            id,
            flats: {
              every: {
                apartmentId,
              },
            },
          },
          include: {
            flats: {
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
            },
          },
        });

        if (!delivery) throw new NotFoundException('Delivery not found');

        const lastDeliveryRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              deliveryId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastDeliveryRequest || lastDeliveryRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        const deliveryCheckOut = await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            deliveryId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flats: {
              connect: delivery.flats.map((flat) => ({ id: flat.id })),
            },
            image: lastDeliveryRequest?.image,
          },
        });

        for (const flat of delivery.flats) {
          const deliveryClients = await this.prisma.clientUser.findMany({
            where: {
              archive: false,
              offline: false,
              currentFlats: {
                some: {
                  flatId: flat.id,
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

          const tokens: string[] = deliveryClients
            .flatMap((client) =>
              client.devices.map((device) => device.fcmToken),
            )
            .filter((token) => token);

          await this.clientNotification.createMultipleNotification(
            {
              type: 'delivery',
              logo: 'out',
              title: `Delivery - ${delivery.name} | Block ${flat.floor.block.name}-${flat.name},${flat.apartment.name}`,
              body: `${delivery.name} has checked out to society from ${surveillance?.name} at ${formatDateTime(deliveryCheckOut.createdAt)}.`,
              clickable: true,
              path: ClientAppRouter.DEFAULT,
              id: deliveryCheckOut.id,
              flatId: flat.id,
            },
            tokens,
            deliveryClients.map((client) => client.id),
          );
        }

        return deliveryCheckOut;
      }

      case 'ride': {
        const ride = await this.prisma.ride.findFirst({
          where: {
            id,
            flat: {
              apartmentId,
            },
          },
          include: {
            flat: {
              select: {
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
            },
            serviceProvider: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!ride) throw new NotFoundException('Ride not found');

        const lastRideRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              rideId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastRideRequest || lastRideRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        const rideCheckOut = await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            rideId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flatJson: lastRideRequest?.flatJson ?? {},
            parentJson: lastRideRequest?.parentJson ?? {},
            flats: {
              connect: {
                id: ride.flatId,
              },
            },
            image: lastRideRequest?.image,
          },
        });

        const rideClients = await this.prisma.clientUser.findMany({
          where: {
            archive: false,
            offline: false,
            currentFlats: {
              some: {
                flatId: ride.flatId,
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

        const tokens: string[] = rideClients
          .flatMap((client) => client.devices.map((device) => device.fcmToken))
          .filter((token) => token);

        await this.clientNotification.createMultipleNotification(
          {
            type: 'guest',
            logo: 'out',
            title: `Ride Share - ${ride.serviceProvider.name} | Block ${ride.flat.floor.block.name}-${ride.flat.name},${ride.flat.apartment.name}`,
            body: `${ride.riderName} from ${ride.serviceProvider.name} has checked out to society from ${surveillance?.name} at ${formatDateTime(rideCheckOut.createdAt)}.`,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            id: rideCheckOut.id,
            flatId: ride.flatId,
          },
          tokens,
          rideClients.map((client) => client.id),
        );

        return rideCheckOut;
      }

      case 'service': {
        const service = await this.prisma.serviceUser.findFirst({
          where: {
            id,
            flat: {
              apartmentId,
            },
          },
          include: {
            flat: {
              select: {
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
            },
            serviceType: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!service) throw new NotFoundException('Service not found');

        const lastServiceRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              serviceId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastServiceRequest || lastServiceRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        const serviceCheckOut = await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            serviceId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            flatJson: lastServiceRequest?.flatJson ?? {},
            parentJson: lastServiceRequest?.parentJson ?? {},
            flats: {
              connect: {
                id: service.flatId,
              },
            },
            image: lastServiceRequest?.image,
          },
        });

        const serviceClients = await this.prisma.clientUser.findMany({
          where: {
            archive: false,
            offline: false,
            currentFlats: {
              some: {
                flatId: service.flatId,
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

        const tokens: string[] = serviceClients
          .flatMap((client) => client.devices.map((device) => device.fcmToken))
          .filter((token) => token);

        await this.clientNotification.createMultipleNotification(
          {
            type: 'service',
            logo: 'out',
            title: `Service - ${service.serviceType.name} | Block ${service.flat.floor.block.name}-${service.flat.name},${service.flat.apartment.name}`,
            body: `${service.name} from ${service.serviceType.name} has checked out to society from ${surveillance?.name} at ${formatDateTime(serviceCheckOut.createdAt)}.`,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            id: serviceCheckOut.id,
            flatId: service.flatId,
          },
          tokens,
          serviceClients.map((client) => client.id),
        );

        return serviceCheckOut;
      }

      case 'vehicle': {
        const vehicle = await this.prisma.vehicleEntry.findFirst({
          where: {
            id,
            apartmentId,
          },
        });

        if (!vehicle) throw new NotFoundException('Vehicle not found');

        const lastVehicleRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              vehicleId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastVehicleRequest || lastVehicleRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        return await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            vehicleId: id,
            requestType: type,
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
            image: lastVehicleRequest?.image,
          },
        });
      }

      case 'group': {
        const group = await this.prisma.groupEntry.findFirst({
          where: {
            id,
            apartmentId,
          },
        });

        if (!group) throw new NotFoundException('Group not found');

        const lastGroupRequest = await this.prisma.checkInOut.exists(
          apartmentId,
          {
            where: {
              requestType: type,
              groupEntryId: id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        if (!lastGroupRequest || lastGroupRequest.type === 'checkout')
          throw new BadRequestException(
            'Not checked In or already checked out',
          );

        return await this.prisma.checkInOut.create({
          data: {
            type: 'checkout',
            apartmentId,
            groupEntryId: id,
            requestType: 'group',
            createdByType: 'guard',
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            createdByGuardId: loggedUserData.id,
          },
        });
      }

      default:
        throw new NotFoundException('Invalid request type');
    }
  }

  async getWaitingApprovalByType(data: GetParam) {
    const { apartmentId, id } = data;

    const exist = await this.prisma.checkInOut.findUnique({
      where: {
        id,
        // requests: {
        // some: {
        //   // status: {
        //   //   not: 'approved',
        //   // },
        // },
        // some: {
        //   hasGuardCheckedIn: false,
        //   status: {
        //     not: 'rejected',
        //   },
        //   parcelHistory: {
        //     none: {},
        //   },
        // },
        // },
      },
      include: {
        requests: true,
      },
    });

    console.log(exist);

    if (!exist) throw new BadRequestException('CheckInOut does not exist');

    switch (exist.requestType) {
      case 'ride': {
        const valid = await this.getValidCheckInOut(apartmentId, id, 'rideId');
        return valid;
      }
      case 'delivery': {
        const valid = await this.getValidCheckInOut(
          apartmentId,
          id,
          'deliveryId',
        );
        return valid;
      }
      case 'service': {
        const valid = await this.getValidCheckInOut(
          apartmentId,
          id,
          'serviceId',
        );
        return valid;
      }
      case 'guest': {
        const valid = await this.getValidCheckInOut(apartmentId, id, 'guestId');
        return valid;
      }
      default:
        throw new BadRequestException('Type does not exist');
    }
  }

  // async getWaitingApproval(datas: GetAllParams) {
  //   const { apartmentId } = datas;

  //   const pendingCheckIn = await this.prisma.checkInOut.findMany({
  //     where: {
  //       apartmentId,
  //       requestType: { in: ['ride', 'delivery', 'service', 'guest'] },
  //       requests: {
  //         some: {
  //           hasGuardCheckedIn: false,
  //           hasGuardDenied: false,
  //         },
  //       },
  //     },
  //     distinct: ['groupId'],
  //     select: {
  //       id: true,
  //       requestType: true,
  //       group: true,
  //       groupId: true,
  //       ride: {
  //         select: {
  //           riderName: true,
  //           serviceProvider: {
  //             select: {
  //               image: { select: { url: true } },
  //             },
  //           },
  //         },
  //       },
  //       delivery: {
  //         select: {
  //           name: true,
  //           serviceProvider: {
  //             select: {
  //               image: { select: { url: true } },
  //             },
  //           },
  //         },
  //       },
  //       service: {
  //         select: {
  //           name: true,
  //           serviceType: {
  //             select: {
  //               image: { select: { url: true } },
  //             },
  //           },
  //         },
  //       },
  //       guest: {
  //         select: {
  //           name: true,
  //         },
  //       },
  //       image: true,
  //       requests: {
  //         where: {
  //           hasGuardCheckedIn: false,
  //           // status: {
  //           //   not: 'rejected',
  //           // },
  //         },
  //         select: {
  //           id: true,
  //           type: true,
  //           status: true,
  //           flat: {
  //             select: {
  //               name: true,
  //               floor: {
  //                 select: {
  //                   name: true,
  //                   block: { select: { name: true } },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });

  //   const data = await Promise.all(
  //     pendingCheckIn.map(async (entry) => {
  //       const { requestType, ...rest } = entry;
  //       const requestDetails = rest[requestType];
  //       let count = 0;
  //       if (entry.group && entry.groupId && entry.groupId !== '') {
  //         count = await this.prisma.guest.count({
  //           where: {
  //             groupId: entry.groupId,
  //             group: true,
  //           },
  //         });
  //       }
  //       return {
  //         ...entry,
  //         name: requestDetails?.name || requestDetails?.riderName,
  //         serviceImage:
  //           requestDetails?.serviceProvider?.image?.url ||
  //           requestDetails?.serviceType?.image?.url ||
  //           null,
  //         count,
  //       };
  //     }),
  //   );

  //   return data;
  // }

  async getWaitingApproval(datas: GetAllParams) {
    const { apartmentId } = datas;

    const pendingCheckIn = await this.prisma.checkInOut.findMany({
      where: {
        apartmentId,
        requestType: { in: ['ride', 'delivery', 'service', 'guest'] },
        requests: {
          some: {
            hasGuardCheckedIn: false,
            hasGuardDenied: false,
          },
        },
      },
      select: {
        id: true,
        requestType: true,
        group: true,
        groupId: true,
        ride: {
          select: {
            riderName: true,
            serviceProvider: {
              select: {
                image: { select: { url: true } },
              },
            },
          },
        },
        delivery: {
          select: {
            name: true,
            serviceProvider: {
              select: {
                image: { select: { url: true } },
              },
            },
          },
        },
        service: {
          select: {
            name: true,
            serviceType: {
              select: {
                image: { select: { url: true } },
              },
            },
          },
        },
        guest: {
          select: {
            name: true,
          },
        },
        image: true,
        requests: {
          where: {
            hasGuardCheckedIn: false,
          },
          select: {
            id: true,
            type: true,
            status: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group entries by groupId if they have a group, otherwise keep them individual
    const groupedEntries = pendingCheckIn.reduce(
      (acc, entry) => {
        if (entry.group && entry.groupId) {
          if (!acc[entry.groupId]) {
            acc[entry.groupId] = [entry];
          } else {
            acc[entry.groupId].push(entry);
          }
        } else {
          acc[entry.id] = [entry];
        }
        return acc;
      },
      {} as Record<string, typeof pendingCheckIn>,
    );

    const data = await Promise.all(
      Object.values(groupedEntries).map(async (entries) => {
        const entry = entries[0]; // Use the first entry of each group (or individual entry)
        const { requestType, ...rest } = entry;
        const requestDetails = rest[requestType];

        let count = entries.length;
        if (entry.group && entry.groupId) {
          count = await this.prisma.guest.count({
            where: {
              groupId: entry.groupId,
              group: true,
            },
          });
        }

        return {
          ...entry,
          name: requestDetails?.name || requestDetails?.riderName || 'Unknown',
          serviceImage:
            requestDetails?.serviceProvider?.image?.url ||
            requestDetails?.serviceType?.image?.url ||
            null,
          count,
        };
      }),
    );

    return data;
  }

  async resendNotificationToClient(data: GetParam) {
    const { id, apartmentId } = data;

    const requests = await this.prisma.checkInOutRequest.findMany({
      where: {
        id,
        checkInOut: {
          apartmentId,
          requestType: {
            in: ['delivery', 'guest', 'ride', 'service'],
          },
        },
      },
      select: {
        id: true,
        type: true,
        flatId: true,
        checkInOut: {
          select: {
            group: true,
            groupId: true,
            id: true,
            requestType: true,
            ride: {
              select: {
                riderName: true,
                contact: true,
                serviceProvider: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            delivery: {
              select: {
                name: true,
                contact: true,
                serviceProvider: {
                  select: {
                    name: true,
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
            guest: {
              select: {
                name: true,
                contact: true,
              },
            },
          },
        },
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

    if (
      (requests.length > 0,
      requests[0].checkInOut.requestType === 'guest' &&
        requests[0].checkInOut.group &&
        requests[0].checkInOut.groupId)
    ) {
      const groupId = requests[0].checkInOut.groupId;

      await this.prisma.checkInOutRequest.updateMany({
        where: {
          checkInOut: {
            groupId,
            group: true,
          },
        },
        data: {
          status: 'pending',
        },
      });

      const guests = await this.prisma.guest.findMany({
        where: {
          groupId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      await this.prisma.guest.updateMany({
        where: {
          groupId,
        },
        data: {
          status: 'pending',
        },
      });

      const clients = await this.prisma.clientUser.findMany({
        where: {
          currentFlats: {
            some: {
              flatId: requests[0].flatId,
              offline: false,
            },
          },
        },
        include: {
          devices: {
            distinct: ['fcmToken'],
          },
        },
      });

      const tokens: string[] = clients
        .flatMap((client) => client.devices.map((i) => i.fcmToken))
        .filter((token) => token);

      await this.clientNotification.createMultipleNotification(
        {
          type: 'guest',
          title: `Guest - ${guests[0].name} and ${guests.length - 1} more | Block ${requests[0].flat.floor.block.name} - ${requests[0].flat.name},${requests[0].flat.apartment.name}`,
          body: `Your guest is at the gate. Do you want to let in? Tap to take action.`,
          clickable: true,
          logo: 'guest',
          path: `${ClientAppRouter.VISITOR_NOTIFICATION_SCREEN}/${requests[0].checkInOut.id}`,
          id: requests[0].checkInOut.id,
          live: 'yes',
          sound: 'yes',
          flatId: requests[0].flatId,
        },
        tokens,
        clients.map((client) => client.id),
        false,
      );

      return 'Notification sent to clients';
    }

    for (const request of requests) {
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

      let body: string = '';
      let title: string = '';
      let type: any;

      switch (request.checkInOut.requestType) {
        case 'ride':
          type = 'ride';
          title =
            `Ride Share - ${request.checkInOut.ride?.serviceProvider?.name} |` +
            `Block ${request.flat.floor.block.name} - ${request.flat.name}, ` +
            `${request.flat.apartment.name}`;
          body =
            `${request.checkInOut.ride?.riderName} from ` +
            `${request.checkInOut.ride?.serviceProvider?.name} is at the gate.` +
            `Do you want to let them in? Tap to take action.`;
          break;

        case 'delivery':
          type = 'delivery';
          title =
            `Delivery - ${request.checkInOut.delivery?.serviceProvider?.name} |` +
            `Block ${request.flat.floor.block.name} - ${request.flat.name},` +
            `${request.flat.apartment.name}`;
          body =
            `${request.checkInOut.delivery?.name} from ` +
            `${request.checkInOut.delivery?.serviceProvider?.name} is at the gate. ` +
            `Do you want to let them in? Tap to take action.`;
          break;

        case 'service':
          type = 'service';
          title =
            `Service - ${request.checkInOut.service?.serviceType?.name} |` +
            `Block ${request.flat.floor.block.name} - ${request.flat.name},` +
            `${request.flat.apartment.name}`;
          body =
            `${request.checkInOut.service?.serviceType?.name}` +
            `${request.checkInOut.service?.name || ''} is at the gate.` +
            `Do you want to let them in? Tap to take action.`;
          break;

        case 'guest':
          type = 'guest';
          title =
            `Guest - ${request.checkInOut.guest?.name} | ` +
            `Block ${request.flat.floor.block.name} - ${request.flat.name}` +
            `${request.flat.apartment.name}`;
          body = `Your guest is at the gate. Do you want to let them in? Tap to take action.`;
          break;

        default:
          break;
      }

      await this.clientNotification.createMultipleNotification(
        {
          type,
          title,
          body,
          clickable: true,
          logo: 'in',
          path:
            ClientAppRouter.VISITOR_NOTIFICATION_SCREEN +
            `/${request.checkInOut.id}`,
          id: request.id,
          live: 'yes',
          sound: 'yes',
          flatId: request.flatId,
        },
        tokens,
        clients.map((client) => client.id),
        false,
      );
    }

    await this.prisma.checkInOutRequest.update({
      where: {
        id,
      },
      data: {
        status: 'pending',
      },
    });

    return 'Notification sent to clients';
  }

  async forceApproveCheckIn(
    data: CreateParams<UpdateCheckInDto> & { id: string },
  ) {
    const { loggedUserData, apartmentId, postData, id } = data;

    const { status } = postData;

    const valid = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        type: 'checkin',
        status: { notIn: ['approved', 'rejected'] },
        checkInOut: { apartmentId },
      },
      include: {
        flat: {
          select: {
            name: true,
            floor: {
              select: { name: true, block: { select: { name: true } } },
            },
            apartment: { select: { name: true } },
          },
        },
        requestApproved: {
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
                leaveAtGate: true,
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

    if (!valid || !valid.checkInOut) {
      throw new NotFoundException('CheckIn not found');
    }

    if (status === 'noresponse') {
      await this.prisma.checkInOutRequest.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });

      return;
    }

    await this.prisma.checkInOutRequest.update({
      where: {
        id,
      },
      data: {
        status,
        approvedByGuardId: status === 'approved' ? loggedUserData.id : null,
        rejectedByGuardId: status === 'rejected' ? loggedUserData.id : null,
      },
    });

    if (valid.checkInOut.guestId) {
      await this.prisma.guest.update({
        where: { id: valid.checkInOut.guestId },
        data: { status },
      });
    }

    if (valid.checkInOut.serviceId) {
      await this.prisma.serviceUser.update({
        where: { id: valid.checkInOut.serviceId },
        data: { status },
      });
    }

    if (valid.checkInOut.rideId) {
      await this.prisma.ride.update({
        where: { id: valid.checkInOut.rideId },
        data: { status },
      });
    }

    if (valid.checkInOut.deliveryId) {
      await this.prisma.delivery.updateMany({
        where: { id: valid.checkInOut.deliveryId },
        data: {
          status,
          leaveAtGate: valid.checkInOut?.delivery?.leaveAtGate === true,
        },
      });
    }

    if (valid.checkInOut.group) {
      await this.prisma.checkInOutRequest.updateMany({
        where: {
          checkInOut: {
            group: true,
            groupId: valid.checkInOut.groupId,
          },
        },
        data: {
          status,
        },
      });

      await this.prisma.guest.updateMany({
        where: {
          group: true,
          groupId: valid.checkInOut.groupId,
        },
        data: {
          status,
        },
      });
    }

    const clients = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: { flatId: valid.flatId },
        },
      },
      select: {
        id: true,
        devices: { select: { fcmToken: true } },
      },
    });

    const surveillance = await this.prisma.surveillance.findFirst({
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    let type: ClientNotificationEnum, title: string, bodyMessage: string;

    switch (valid.checkInOut.requestType) {
      case 'guest':
        type = 'guest';
        title = `Entry ${status} by ${loggedUserData.name}`;
        bodyMessage =
          status === 'approved'
            ? `has been approved for check in to ${valid.checkInOut.guest?.name} from ${surveillance?.name}.`
            : `Guest - ${valid.checkInOut.guest?.name} entry is denied.`;
        break;

      case 'delivery':
        type = 'delivery';
        title = `Entry ${status} by ${loggedUserData.name}`;
        bodyMessage =
          status === 'approved'
            ? `${valid.checkInOut.delivery?.name} from ${valid.checkInOut.delivery?.serviceProvider.name} has been approved for check in to society from ${surveillance?.name}.`
            : `${valid.checkInOut.delivery?.name} from ${valid.checkInOut.delivery?.serviceProvider?.name} entry is denied.`;
        break;

      case 'ride':
        type = 'ride';
        title = `Entry ${status} by ${loggedUserData.name}`;
        bodyMessage =
          status === 'approved'
            ? `${valid.checkInOut.ride?.riderName} from ${valid.checkInOut.ride?.serviceProvider?.name} has been approved for check in to society from ${surveillance?.name}.`
            : `${valid.checkInOut.ride?.riderName} from ${valid.checkInOut.ride?.serviceProvider?.name} entry is denied.`;
        break;

      case 'service':
        type = 'service';
        title = `Entry ${status} by ${loggedUserData.name}`;
        bodyMessage =
          status === 'approved'
            ? `${valid.checkInOut.service?.serviceType?.name} ${valid.checkInOut.service?.name} has been approved for check in to society from ${surveillance?.name}.`
            : `${valid.checkInOut.service?.serviceType?.name} ${valid.checkInOut.service?.name} entry is denied.`;
        break;

      default:
        return null;
    }

    const tokens = clients
      .map((i) => i.devices.map((d) => d.fcmToken))
      .flat()
      .filter((token) => token);

    await this.clientNotification.createMultipleNotification(
      {
        type,
        title,
        body: bodyMessage,
        clickable: true,
        logo: status === 'approved' ? 'approved' : 'rejected',
        path: ClientAppRouter.VISITOR_SCREEN,
        id: valid.id,
        flatId: valid.flatId,
      },
      tokens,
      clients.map((client) => client.id),
    );
  }

  async createEntry(data: UpdateParams<undefined>) {
    const { loggedUserData, apartmentId, id } = data;

    const valid = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        status: 'approved',
        type: { not: 'checkout' },
        checkInOut: { apartmentId },
        hasGuardCheckedIn: false,
      },
      include: {
        flat: {
          select: {
            name: true,
            floor: {
              select: { name: true, block: { select: { name: true } } },
            },
            apartment: { select: { name: true } },
          },
        },
        requestApproved: {
          select: {
            name: true,
          },
        },
        checkInOut: {
          include: {
            surveillance: { select: { name: true } },
            guest: { select: { name: true, group: true, groupId: true } },
            delivery: {
              select: {
                name: true,
                leaveAtGate: true,
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

    if (!valid) {
      throw new NotFoundException('CheckIn not found');
    }

    await this.prisma.checkInOutRequest.update({
      where: {
        id,
      },
      data: {
        hasGuardCheckedIn: true,
        approvedByGuardId: loggedUserData.id,
      },
    });

    const surveillance = await this.prisma.surveillance.findFirst({
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    const clients = await this.prisma.clientUser.findMany({
      where: {
        archive: false,
        offline: false,
        currentFlats: {
          some: {
            flatId: valid?.flatId,
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

    switch (valid.checkInOut.requestType) {
      case 'delivery': {
        if (valid.checkInOut.delivery?.leaveAtGate) {
          await this.clientNotification.createMultipleNotification(
            {
              type: 'parcel',
              title: `Parcel Collected at Gate - ${valid.checkInOut.delivery.serviceProvider.name} | Block ${valid.flat.floor.block.name} - ${valid.flat.name}, ${valid.flat.apartment.name}`,
              body: `${loggedUserData.name} from ${surveillance?.name} has collected your parcel.`,
              id: valid.id,
              clickable: true,
              logo: 'in',
              path: ClientAppRouter.DEFAULT,
              flatId: valid.flatId,
            },
            tokens,
            clients.map((client) => client.id),
          );
        } else {
          await this.clientNotification.createMultipleNotification(
            {
              type: 'delivery',
              title: `Delivery - ${valid.checkInOut.delivery?.serviceProvider.name} | Block ${valid.flat.floor.block.name} - ${valid.flat.name}, ${valid.flat.apartment.name}`,
              body: `${valid.checkInOut.delivery?.name} from ${valid.checkInOut.delivery?.serviceProvider.name} has checked in to society from ${surveillance?.name} at ${formatDateTime(new Date())}.`,
              id: valid.id,
              clickable: true,
              logo: 'in',
              path: ClientAppRouter.DEFAULT,
              flatId: valid.flatId,
            },
            tokens,
            clients.map((client) => client.id),
          );
        }
        return;
      }

      case 'ride': {
        await this.clientNotification.createMultipleNotification(
          {
            type: 'ride',
            logo: 'in',
            title: `Ride Share - ${valid.checkInOut.ride?.serviceProvider.name} | Block ${valid.flat.floor.block.name}-${valid.flat.name},${valid.flat.apartment.name}`,
            body: `${valid.checkInOut.ride?.riderName} from ${valid.checkInOut.ride?.serviceProvider.name} has checked in to society from ${surveillance?.name} at ${formatDateTime(new Date())}.`,
            id: valid.id,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            flatId: valid.flatId,
          },
          tokens,
          clients.map((client) => client.id),
        );
        return;
      }

      case 'service': {
        await this.clientNotification.createMultipleNotification(
          {
            type: 'service',
            logo: 'in',
            title: `Service - ${valid.checkInOut.service?.serviceType.name} | Block ${valid.flat.floor.block.name}-${valid.flat.name},${valid.flat.apartment.name}`,
            body: `${valid.checkInOut.service?.name} from ${valid.checkInOut.service?.serviceType.name} has checked in to society from ${surveillance?.name} at ${formatDateTime(new Date())}.`,
            id: valid.id,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            flatId: valid.flatId,
          },
          tokens,
          clients.map((client) => client.id),
        );
        return;
      }

      case 'guest': {
        const isGroup = valid.checkInOut.group && valid.checkInOut.groupId;

        let count = 0;
        if (isGroup) {
          await this.prisma.checkInOutRequest.updateMany({
            where: {
              checkInOut: {
                group: true,
                groupId: valid.checkInOut.groupId,
              },
            },
            data: {
              hasGuardCheckedIn: true,
            },
          });

          const x = await this.prisma.guest.updateMany({
            where: {
              group: true,
              groupId: valid.checkInOut.groupId,
            },
            data: {
              status: 'approved',
            },
          });
          count = x.count;
        }

        await this.clientNotification.createMultipleNotification(
          {
            type: 'guest',
            logo: 'in',
            title: `Guest - ${valid.checkInOut.guest?.name} ${isGroup ? ` +${count - 1} more` : ''}| Block ${valid.flat.floor.block.name}-${valid.flat.name},${valid.flat.apartment.name}`,
            body: `has checked in to society from ${surveillance?.name} at ${formatDateTime(new Date())}.`,
            id: valid.id,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            flatId: valid.flatId,
          },
          tokens,
          clients.map((client) => client.id),
        );
        return;
      }

      default:
        throw new NotFoundException('Invalid request type');
    }
  }

  async deniedEntry(data: UpdateParams<undefined>) {
    const { apartmentId, id } = data;

    const valid = await this.prisma.checkInOutRequest.findFirst({
      where: {
        id,
        status: 'rejected',
        checkInOut: { apartmentId },
        hasGuardCheckedIn: false,
      },
    });

    if (!valid) {
      throw new NotFoundException('CheckIn not found');
    }

    await this.prisma.checkInOutRequest.update({
      where: {
        id,
      },
      data: {
        hasGuardDenied: true,
      },
    });
  }

  private async getValidCheckInOut(
    apartmentId: string,
    id: string,
    typeField: string,
  ) {
    const valid = await this.prisma.checkInOut.findFirst({
      where: {
        apartmentId,
        id,
        type: 'checkin',
        [typeField]: { not: null },
      },
      select: {
        id: true,
        requestType: true,
        group: true,
        groupId: true,
        ride: {
          select: {
            riderName: true,
            contact: true,
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
          },
        },
        delivery: {
          select: {
            name: true,
            contact: true,
            leaveAtGate: true,
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
          },
        },
        service: { select: { name: true, contact: true } },
        guest: { select: { name: true, contact: true } },
        image: true,
        vehicleNo: true,
        vehicleType: true,
        requests: {
          where: {
            hasGuardCheckedIn: false,
            hasGuardDenied: false,
            // status: {
            //   not: 'rejected',
            // },
            // parcelHistory: {
            //   none: {},
            // },
            // status: {
            //   not: 'approved',
            // },
            // hasUserConfirmed: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            status: true,
            flat: {
              select: {
                id: true,
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

    if (!valid) throw new BadRequestException('Invalid CheckInOut');

    const count =
      valid.group && valid.groupId
        ? await this.prisma.guest.count({
            where: {
              groupId: valid.groupId,
              group: true,
            },
          })
        : 0;

    return {
      ...valid,
      count,
      main: {
        ...valid[valid.requestType],
        leaveAtGate: valid.delivery?.leaveAtGate
          ? valid.delivery.leaveAtGate
          : false,
        serviceProvider: valid[valid.requestType]?.serviceProvider
          ? valid[valid.requestType].serviceProvider
          : null,
      },
    };
  }

  private async updateGuardNotifications(loggedUserData: any, typeId: string) {
    const guardNotifications = await this.prisma.guardNotification.findMany({
      where: {
        guardUserId: loggedUserData.id,
        isRead: false,
        clickable: true,
        redirectId: typeId,
      },
    });

    for (const notification of guardNotifications) {
      await this.prisma.guardNotification.update({
        where: { id: notification.id },
        data: { clickable: false },
      });
    }
  }
}
