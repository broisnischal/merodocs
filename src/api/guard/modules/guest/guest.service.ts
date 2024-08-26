import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../common/interface';
import { createGuestDto, entryGuestMassDto } from './dtos/index.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { CheckInOutLogService } from 'src/global/checkinout/checkinout.service';
import { createMultipleGuestNotificationDto } from './dtos/create-guestnotification';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';

@Injectable()
export class GuestService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly awsService: AWSStorageService,
    private readonly jsonService: CheckInOutLogService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async create(
    data: CreateParams<createGuestDto & { image: Express.Multer.File }>,
  ) {
    const { apartmentId, loggedUserData, postData } = data;
    const {
      flatId,
      contact,
      name,
      noOfGuests,
      vehicleType,
      vehicleNo,
      group,
      groupId,
    } = postData;

    const validFlat = await this.prisma.flat.findFirst({
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
            id: true,
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
        'Invalid flat or Unassigned flat been selected.',
      );

    const parentJson = await this.jsonService.findParentUser(validFlat.id);

    const checkInOut = await this.prisma.$transaction(async (prisma) => {
      const guest = await prisma.guest.create({
        data: {
          type: 'manual',
          status: 'pending',
          name,
          contact,
          noOfGuests,
          flatId,
          group,
          groupId,
        },
      });

      const image = await this.awsService.uploadToS3(postData.image);

      const flatJson = this.jsonService.createFlatJson(validFlat);

      const checkInOut = await prisma.checkInOut.create({
        data: {
          type: 'checkin',
          requestType: 'guest',
          createdByType: 'guard',
          createdByGuardId: loggedUserData.id,
          surveillanceId: loggedUserData.defaultSurveillanceId
            ? loggedUserData.defaultSurveillanceId
            : loggedUserData.surveillanceId,
          vehicleNo,
          vehicleType,
          guestId: guest.id,
          apartmentId: loggedUserData.apartmentId,
          image: image.url,
          flatJson,
          parentJson: parentJson ? parentJson : undefined,
          group,
          groupId,
          flats: {
            connect: {
              id: flatId,
            },
          },
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

    if (group) {
      return checkInOut;
    }

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

    if (postData.groupId && postData.group) {
      return checkInOut;
    }

    const tokens: string[] = clients
      .flatMap((client) => client.devices.map((device) => device.fcmToken))
      .filter((token) => token);

    await this.clientNotification.createMultipleNotification(
      {
        type: 'guest',
        title: `Guest - ${name} | Block ${validFlat.floor.block.name},${validFlat.apartment.name}`,
        body: `Your guest is at the gate.Do you want to let in? Tap to take action.`,
        clickable: true,
        logo: 'in',
        path: ClientAppRouter.VISITOR_NOTIFICATION_SCREEN + `/${checkInOut.id}`,
        id: checkInOut.id,
        live: 'yes',
        sound: 'yes',
        flatId: validFlat.id,
      },
      tokens,
      clients.map((client) => client.id),
      false,
    );

    return checkInOut;
  }

  async createNotification(
    data: CreateParams<createMultipleGuestNotificationDto>,
  ) {
    const { apartmentId, postData } = data;

    const guests = await this.prisma.guest.findMany({
      where: {
        id: { in: postData.ids },
        flat: {
          apartmentId,
        },
        status: 'pending',
        type: 'manual',
      },
      include: {
        checkInOuts: {
          take: 1,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (guests.length === 0) {
      throw new NotFoundException('No valid guests found');
    }

    // Send notifications to associated clients
    const clients = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: {
            flatId: {
              in: guests.map((guest) => guest.flatId),
            },
            offline: false,
          },
        },
        offline: false,
        archive: false,
      },
      select: {
        id: true,
        devices: { select: { fcmToken: true } },
      },
    });

    const tokens: string[] = clients
      .flatMap((client) => client.devices.map((device) => device.fcmToken))
      .filter((token) => token);

    await this.clientNotification.createMultipleNotification(
      {
        type: 'guest',
        title: `Guest - ${guests[0].name} and ${guests.length - 1} more | Block ${guests[0].flat.floor.block.name} - ${guests[0].flat.name},${guests[0].flat.apartment.name}`,
        body: `Your guest is at the gate. Do you want to let in? Tap to take action.`,
        clickable: true,
        logo: 'guest',
        path:
          ClientAppRouter.VISITOR_NOTIFICATION_SCREEN +
          `/${guests[0]?.checkInOuts[0]?.id || ''}`,
        id: guests[0].groupId!,
        live: 'yes',
        sound: 'yes',
        flatId: guests[0].flatId!,
      },
      tokens,
      clients.map((client) => client.id),
      false,
    );

    return guests;
  }

  async getPreapproved(data: GetAllParams) {
    const { apartmentId, q } = data;

    const guests = await this.prisma.guest.findMany({
      where: {
        flat: {
          name: { contains: q || undefined, mode: 'insensitive' },
          apartmentId,
        },
        type: 'preapproved',
        status: 'pending',
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return guests;
  }

  async getPending(data: GetAllParams) {
    const { apartmentId, id } = data;

    const guests = await this.prisma.guest.findMany({
      where: {
        flat: {
          apartmentId,
        },
        type: 'manual',
        status: 'pending',
        group: true,
        groupId: id,
      },
      select: {
        id: true,
        name: true,
        contact: true,
        status: true,
        checkInOuts: {
          select: { image: true, vehicleNo: true, vehicleType: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedGuests = guests.map((guest) => {
      const { checkInOuts, ...guestData } = guest;
      const { image, vehicleNo, vehicleType } = checkInOuts[0] || {};
      return { ...guestData, image, vehicleNo, vehicleType };
    });

    return transformedGuests;
  }

  async getPendingApproval(data: GetAllParams & { id: string }) {
    const { apartmentId, id } = data;

    const lastGroupGuest = await this.prisma.guest.findFirst({
      where: {
        group: true,
        groupId: id,
      },
      include: {
        flat: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                id: true,
                name: true,
                block: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const guests = await this.prisma.guest.findMany({
      where: {
        flat: {
          apartmentId,
        },
        type: 'manual',
        group: true,
        groupId: lastGroupGuest?.groupId,
      },
      select: {
        id: true,
        name: true,
        contact: true,
        status: true,
        checkInOuts: {
          select: { image: true, vehicleNo: true, vehicleType: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedGuests = guests.map((guest) => {
      const { checkInOuts, ...guestData } = guest;
      const { image, vehicleNo, vehicleType } = checkInOuts[0] || {};
      return {
        ...guestData,
        image,
        vehicleNo,
        vehicleType,
      };
    });

    return { guests: transformedGuests, flat: lastGroupGuest?.flat };
  }

  async deleteGuest(data: DeleteParams) {
    const { apartmentId, id } = data;
    const exists = await this.prisma.guest.findUnique({
      where: {
        id,
        flat: {
          apartmentId,
        },
        type: 'manual',
        status: 'pending',
      },
    });

    if (!exists) {
      throw new NotFoundException('Guest not found');
    }

    const guest = await this.prisma.guest.delete({
      where: { id },
    });

    return guest.id;
  }

  async getPreapprovedId(data: GetParam) {
    const { apartmentId, id } = data;

    const guest = await this.prisma.guest.findFirst({
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
            name: true,
            contact: true,
          },
        },
        createdByType: true,
        startDate: true,
        endDate: true,
        isOneDay: true,
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

    if (!guest) throw new NotFoundException('Guest does not exist');

    const currentDate = new Date();
    const endDate = new Date(guest.endDate!);

    const endDateNoon = new Date(endDate);
    endDateNoon.setHours(12, 0, 0, 0);

    const isAfterNoon = currentDate > endDateNoon;

    if (isAfterNoon) {
      return { warning: true, guest };
    }

    return { warning: false, guest };
  }

  async getMassEvent(data: GetAllParams) {
    const { apartmentId, q } = data;

    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const upcomingGuests = await this.prisma.guestMass.findMany({
      where: {
        flat: {
          name: { contains: q || undefined, mode: 'insensitive' },
          apartmentId,
        },
        startDate: {
          gte: endOfToday,
        },
      },
      select: {
        id: true,
        createdBy: {
          select: {
            name: true,
            contact: true,
            image: {
              select: { url: true },
            },
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
        total: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const todaysGuests = await this.prisma.guestMass.findMany({
      where: {
        flat: {
          name: { contains: q || undefined, mode: 'insensitive' },
          apartmentId,
        },
        startDate: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        createdBy: {
          select: {
            name: true,
            contact: true,
            image: {
              select: { url: true },
            },
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
        total: true,
        entered: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const withNumberExceeded = todaysGuests.map((guest) => ({
      ...guest,
      exceeded: Math.max(guest.entered - guest.total, 0),
      createdBy: {
        ...guest.createdBy,
        type: guest.createdByType,
      },
    }));

    return { upcomingGuests, todaysGuests: withNumberExceeded };
  }

  async getMassEventById(data: GetAllParams & { number?: number }) {
    const { apartmentId, id, number } = data;

    const massGuest = await this.prisma.guestMass.findFirst({
      where: {
        id,
        flat: {
          apartmentId,
        },
      },
      select: {
        id: true,
        createdBy: {
          select: {
            name: true,
            contact: true,
            image: {
              select: { url: true },
            },
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
        total: true,
        entered: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!massGuest) throw new NotFoundException('Mass guest does not exist');

    let timeWarning = false;
    let numberWarning = false;

    // If number is provided, calculate newEnteredCount and check numberWarning
    if (number !== undefined) {
      const newEnteredCount = massGuest.entered + number;
      numberWarning = newEnteredCount > massGuest.total;
    }

    const currentDate = new Date();
    const endDate = new Date(massGuest.endDate!);

    const endDateNoon = new Date(endDate);
    endDateNoon.setHours(12, 0, 0, 0);

    const exceeded = Math.max(massGuest.entered - massGuest.total, 0);

    // Check if the current date is after the end date at 12:00 PM
    const isAfterNoon = currentDate > endDateNoon;

    if (isAfterNoon) {
      timeWarning = true;
    }

    return {
      timeWarning,
      numberWarning,
      ...massGuest,
      exceeded,
      createdBy: {
        ...massGuest.createdBy,
        type: massGuest.createdByType,
      },
    };
  }

  async getMassHistory(data: GetAllParams & { date?: string }) {
    const { apartmentId, date } = data;

    let startDateToday: Date, endDateToday: Date;
    let whereCondition: any = {
      flat: {
        apartmentId,
      },
      startDate: {
        lt: new Date(),
      },
    };

    if (date) {
      startDateToday = new Date(date);
      startDateToday.setHours(0, 0, 0, 0); // Set to start of the day
      endDateToday = new Date(date);
      endDateToday.setHours(23, 59, 59, 999); // Set to end of the day

      whereCondition.AND = [
        {
          startDate: {
            gte: startDateToday,
          },
        },
        {
          endDate: {
            lte: endDateToday,
          },
        },
      ];
    }

    const history = await this.prisma.guestMass.findMany({
      where: whereCondition,
      select: {
        id: true,
        createdBy: {
          select: {
            name: true,
            contact: true,
            image: {
              select: { url: true },
            },
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
        total: true,
        entered: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const withNumberExceeded = history.map((guest) => ({
      ...guest,
      exceeded: Math.max(guest.entered - guest.total, 0),
      createdBy: {
        ...guest.createdBy,
        type: guest.createdByType,
      },
    }));

    return withNumberExceeded;
  }

  async getMassHistoryById(data: GetParam) {
    const { apartmentId, id } = data;

    const history = await this.prisma.guestMass.findFirst({
      where: {
        flat: {
          apartmentId,
        },
        id,
      },
      select: {
        checkInOuts: {
          select: {
            createdByGuard: {
              select: {
                name: true,
              },
            },
            surveillance: {
              select: { name: true },
            },
            entered: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!history) throw new NotFoundException('Guest doesnot exist');
    return history;
  }

  async entryMass(data: UpdateParams<entryGuestMassDto>) {
    const { apartmentId, loggedUserData, postData, id } = data;
    const { entered } = postData;

    const valid = await this.prisma.guestMass.findFirst({
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
      },
    });

    if (!valid) throw new NotFoundException('Mass guest does not exist');

    const flatJson = this.jsonService.createFlatJson(valid.flat);
    const parentJson = this.jsonService.createParentJSON(valid.createdBy);

    const checkInOutEntry = await this.prisma.checkInOut.create({
      data: {
        type: 'checkin',
        requestType: 'guestmass',
        createdByType: 'user',
        createdByGuardId: loggedUserData.id,
        createdByUserId: valid.createdById,
        surveillanceId: loggedUserData.defaultSurveillanceId
          ? loggedUserData.defaultSurveillanceId
          : loggedUserData.surveillanceId,
        guestMassId: valid.id,
        flatJson,
        parentJson,
        apartmentId,
        entered,
      },
    });

    // Update the entered count
    await this.prisma.guestMass.update({
      where: { id },
      data: { entered: valid.entered + entered },
    });

    await this.prisma.gatePass.updateMany({
      where: {
        guestMassId: valid.id,
      },
      data: {
        expired: true,
      },
    });

    return checkInOutEntry;
  }

  // async uploadMultiple(
  //   data: UpdateParams<
  //     updateMultipleGuestDto & { images: Array<Express.Multer.File> }
  //   >,
  // ) {
  //   const { apartmentId, postData } = data;
  //   let { id, images } = postData;

  //   const ids = id.split(',');

  //   if (!images || images.length === 0) {
  //     throw new BadRequestException('No images provided.');
  //   }

  //   if (ids.length !== images.length) {
  //     throw new BadRequestException(
  //       'Number of IDs must match the number of images.',
  //     );
  //   }

  //   const valid = await this.prisma.checkInOut.findMany({
  //     where: {
  //       id: {
  //         in: ids,
  //       },
  //       apartmentId: apartmentId,
  //     },
  //   });

  //   const invalidIds = ids.filter(
  //     (id) => !valid.some((entry) => entry.id === id),
  //   );

  //   if (invalidIds.length > 0) {
  //     throw new BadRequestException(`Invalid IDs: ${invalidIds.join(', ')}`);
  //   }

  //   // Upload all images concurrently and associate them with corresponding IDs
  //   const uploadTasks = images.map(async (image, index) => {
  //     const uploadedImage = await this.awsService.uploadToS3(image);

  //     await this.prisma.checkInOut.update({
  //       where: { id: ids[index] },
  //       data: { image: uploadedImage.url },
  //     });

  //     return { id: ids[index], image: uploadedImage };
  //   });

  //   const uploadedImagesWithIds = await Promise.all(uploadTasks);

  //   return uploadedImagesWithIds;
  // }

  // async createMultiple(data: CreateParams<createMultipleGuestDto>) {
  //   const { apartmentId, loggedUserData, postData } = data;

  //   const { flatId, guests } = postData;

  //   const validFlat = await this.prisma.flat.findFirst({
  //     where: {
  //       id: flatId,
  //       apartmentId,
  //       archive: false,
  //     },
  //     select: {
  //       id: true,
  //       name: true,
  //       floor: {
  //         select: {
  //           name: true,
  //           block: {
  //             select: {
  //               name: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!validFlat) throw new NotFoundException('Flat does not exist');

  //   const parentJson = await this.jsonService.findParentUser(validFlat.id);
  //   const flatJson = this.jsonService.createFlatJson(validFlat);

  //   const createdCheckInOuts = await this.prisma.$transaction(
  //     async (prisma) => {
  //       const checkInOuts = await Promise.all(
  //         guests.map(async (guestData) => {
  //           const guest = await prisma.guest.create({
  //             data: {
  //               type: 'manual',
  //               status: 'pending',
  //               name: guestData.name,
  //               contact: guestData.contact,
  //               flatId,
  //             },
  //           });

  //           const checkInOut = await prisma.checkInOut.create({
  //             data: {
  //               type: 'checkin',
  //               requestType: 'guest',
  //               createdByType: 'guard',
  //               createdByGuardId: loggedUserData.id,
  //               surveillanceId: loggedUserData.defaultSurveillanceId
  //                 ? loggedUserData.defaultSurveillanceId
  //                 : loggedUserData.surveillanceId,
  //               vehicleNo: guestData.vehicleNo,
  //               vehicleType: guestData.vehicleType,
  //               guestId: guest.id,
  //               apartmentId: loggedUserData.apartmentId,
  //               flatJson,
  //               parentJson: parentJson ? parentJson : undefined,
  //               requests: {
  //                 create: {
  //                   type: 'checkin',
  //                   status: 'pending',
  //                   flatId,
  //                 },
  //               },
  //             },
  //             include: {
  //               guest: true,
  //               requests: true,
  //             },
  //           });

  //           return checkInOut.id;
  //         }),
  //       );

  //       return checkInOuts;
  //     },
  //   );

  //   return createdCheckInOuts;
  // }
}
