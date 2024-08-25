import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface';
import { createFlatDto, updateFlatDto, checkFlatDto } from './dtos';
import { getFlatHistoryQueryDto } from './dtos/get-history.dto';
import { createOfflineResidentDto } from './dtos/create-offlineresident.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import moment from 'moment';

interface GetExtended {
  apartmentId: string;
  queries: getFlatHistoryQueryDto;
}

@Injectable()
export class FlatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
    private readonly awsService: AWSStorageService,
  ) {}

  async checkUnique(data: CreateParams<checkFlatDto>) {
    const { postData } = data;

    const { name, floorId } = postData;

    const valid = await this.prisma.floor.findUnique({
      where: { id: floorId },
    });

    if (!valid) throw new NotFoundException('Floor doesnot exist');

    const conflict = await this.prisma.flat.findFirst({
      where: { name, floorId: valid.id },
    });

    if (conflict) throw new ConflictException(`Flat name already exists`);
  }

  async create(data: CreateParams<createFlatDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { floorId, flats } = postData;

    const valid = await this.prisma.floor.findUnique({
      where: { id: floorId },
    });

    if (!valid) throw new NotFoundException('Floor doesnot exist');

    const response = await Promise.all(
      flats.map(async (item) => {
        const conflict = await this.prisma.flat.findFirst({
          where: { name: item.name, floorId: valid.id },
        });

        if (conflict) throw new ConflictException('Flat name already exists');

        const flat = await this.prisma.flat.create({
          data: {
            name: item.name,
            apartmentId,
            floorId,
            type: item.type,
            createdById: loggedUserData.id,
            updatedById: loggedUserData.id,
          },
        });

        return flat;
      }),
    );

    await this.activityService.create({
      message: `Created multiple flat for ${valid.name} floor`,
      type: 'floorandflat',
      loggedUserData,
      blockId: valid.blockId,
    });

    return response;
  }

  async update(data: UpdateParams<updateFlatDto>) {
    const { id, postData, loggedUserData } = data;

    const { name, type } = postData;

    const valid = await this.prisma.flat.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Flat doesnot exist');

    if (name && name !== valid.name) {
      const conflict = await this.prisma.flat.findFirst({
        where: { name, floorId: valid.floorId },
      });

      if (conflict) throw new ConflictException('Flat name already exists');
    }

    const floor = await this.prisma.floor.findUnique({
      where: { id: valid.floorId },
    });

    const flat = await this.prisma.flat.update({
      where: { id },
      data: {
        name,
        type,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the flat ${name} from ${floor?.name}`,
      type: 'floorandflat',
      loggedUserData,
      blockId: floor?.blockId,
    });

    return flat;
  }

  async assignResidentUser(
    data: UpdateParams<
      createOfflineResidentDto & { image?: Express.Multer.File }
    >,
  ) {
    const { apartmentId, id, loggedUserData } = data;

    const valid = await this.prisma.flat.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Flat doesnot exist');

    const { name, contact, email, type, initiationDate } = data.postData;

    const alreadyExist = await this.prisma.clientUser.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            contact,
          },
        ],
      },
    });

    if (alreadyExist) throw new ConflictException('User already exist');

    const image =
      data.postData.image &&
      (await this.awsService.uploadToS3(data.postData.image));

    const user = await this.prisma.clientUser.create({
      data: {
        name,
        contact,
        email,
        offline: true,
        image: image && { create: { name: image.name, url: image.url } },
        flats: {
          connect: {
            id,
          },
        },
        apartments: {
          connect: {
            id: apartmentId,
          },
        },
        acceptedById: loggedUserData.id,
        clientApartments: {
          create: {
            type,
            apartmentId,
            residing: true,
            flatId: id,
            requestType: 'addAccount',
            status: 'approved',
            expired: false,
            movedOutOrNot: false,
            requestFor: 'admin',
            moveIn: initiationDate,
            offline: true,
            updatedById: loggedUserData.id,
          },
        },
        currentFlats: {
          create: {
            type,
            offline: true,
            flatId: id,
            residing: true,
            createdAt: initiationDate,
            hasOwner: type === 'owner' ? false : true,
            apartmentId,
            acceptedById: loggedUserData.id,
          },
        },
      },
    });

    return user;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.flat.findFirst({
      where: { id, floor: { archive: false } },
    });

    if (!valid) throw new NotFoundException('Flat doesnot exist');

    const flat = await this.prisma.flat.update({
      where: { id },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
    });

    const floor = await this.prisma.floor.findUnique({
      where: { id: valid.floorId },
    });

    await this.activityService.create({
      message: `${valid.archive ? 'Restored' : 'Archived'} the flat ${valid.name} from ${floor?.name}`,
      type: 'floorandflat',
      loggedUserData,
      blockId: floor?.blockId,
    });

    return flat;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.flat.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Flat doesnot exist');

    const flat = await this.prisma.flat.delete({
      where: { id },
    });

    const floor = await this.prisma.floor.findUnique({
      where: { id: valid.floorId },
    });

    await this.activityService.create({
      message: `Deleted the flat ${valid.name} from ${floor?.name}`,
      type: 'floorandflat',
      loggedUserData,
      blockId: floor?.blockId,
    });

    return flat;
  }

  async getSingle(data: GetParam) {
    const { id } = data;

    const flat = await this.prisma.flat.findUnique({
      where: { id },
    });

    if (!flat) throw new NotFoundException('Flat doesnot exist');

    return flat;
  }

  async getAll(data: GetAllParams) {
    const { withId, archive, apartmentId } = data;

    const valid = await this.prisma.floor.findUnique({
      where: { id: withId },
    });

    if (!valid) throw new NotFoundException('Floor doesnot exist');

    const flats = await this.prisma.flat.existMany(apartmentId, {
      where: {
        archive,
        floorId: withId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        floor: {
          select: {
            name: true,
          },
        },
        currentClients: {
          select: {
            type: true,
            clientUser: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            guests: {
              where: {
                status: 'approved',
              },
            },
            rides: {
              where: {
                status: 'approved',
              },
            },
            deliveries: {
              where: {
                status: 'approved',
              },
            },
            ServiceUser: {
              where: {
                status: 'approved',
              },
            },
            clientStaffs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = flats.map((i) => {
      const owner = i.currentClients.find((i) => i.type === 'owner');
      const tenant = i.currentClients.find((i) => i.type === 'tenant');
      const result = {
        ...i,
        familyMemberCount: i.currentClients.filter(
          (i) => i.type === 'owner_family' || i.type === 'tenant_family',
        ).length,
        staffCount: i._count.clientStaffs,
        tenantCount: i.currentClients.filter((i) => i.type === 'tenant').length,
        visitorCount:
          i._count.guests +
          i._count.rides +
          i._count.deliveries +
          i._count.ServiceUser,
        owner: owner ? owner.clientUser : null,
        tenant: tenant ? tenant.clientUser : null,
        _count: undefined,
        currentClients: undefined,
      };

      return result;
    });

    return response;
  }

  async getFlatUsersHistory(data: GetParam) {
    const { apartmentId, id } = data;

    const valid = await this.prisma.flat.exists(apartmentId, {
      where: {
        id,
      },
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
        currentClients: {
          select: {
            hasOwner: true,
            id: true,
            type: true,
            clientUser: {
              select: {
                id: true,
                name: true,
                age: true,
                gender: true,
                createdAt: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!valid) throw new NotFoundException("Flat doesn't exist");

    const clientHistory = await this.prisma.apartmentClientUser.existMany(
      apartmentId,
      {
        where: {
          flatId: id,
          requestType: {
            in: ['addAccount', 'moveIn'],
          },
          status: 'approved',
          type: {
            in: ['owner', 'tenant'],
          },
          verifiedByOwner: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          clientUser: {
            select: {
              id: true,
              name: true,
              email: true,
              gender: true,
              age: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          },
          moveIn: true,
          type: true,
          documents: {
            select: {
              name: true,
              url: true,
            },
          },
          createdAt: true,
        },
      },
    );

    const history = await Promise.all(
      clientHistory.map(async (history) => {
        let moveOut: Date | string = 'Currently Residing';
        let moveOutId: string | undefined;

        const moveOutRequest = await this.prisma.apartmentClientUser.exists(
          apartmentId,
          {
            where: {
              flatId: id,
              clientUserId: history.clientUser.id,
              requestType: 'moveOut',
              status: 'approved',
              createdAt: {
                gte: history.createdAt,
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
            select: {
              id: true,
              moveOut: true,
            },
          },
        );

        if (moveOutRequest) {
          if (moveOutRequest.moveOut) {
            moveOut = moveOutRequest.moveOut;
            moveOutId = moveOutRequest.id;
          }
        }

        const tenant =
          history.type === 'owner' &&
          valid.currentClients.find((item) => item.type === 'tenant');

        const sameFlatReq = await this.prisma.apartmentClientUser.findFirst({
          where: {
            apartmentId,
            clientUserId: history.clientUser.id,
            flatId: id,
            status: 'approved',
            requestType: {
              in: ['moveIn', 'becomeOwner'],
            },
            createdAt: {
              gte: history.createdAt,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        return {
          clientUserId: history.clientUser.id,
          moveInId: history.id,
          moveOutId: moveOutId,
          moveIn: history.moveIn,
          moveOut,
          clientUser: history.clientUser,
          documents: history.documents,
          tenant: tenant ? tenant.clientUser : null,
          type: sameFlatReq
            ? sameFlatReq.requestType === 'becomeOwner'
              ? 'owner'
              : history.type
            : history.type,
        };
      }),
    );

    return history;
  }

  async getAllHistoryDetailsWithType(data: GetExtended) {
    const { apartmentId } = data;
    const { flatId, type, moveInId, moveOutId, userId, visitorType } =
      data.queries;

    const moveInRequest = await this.prisma.apartmentClientUser.exists(
      apartmentId,
      {
        where: {
          id: moveInId,
          flatId,
          clientUserId: userId,
          status: 'approved',
          // requestType: 'moveIn',
        },
        select: {
          createdAt: true,
        },
      },
    );

    if (!moveInRequest || !moveInRequest.createdAt)
      throw new BadRequestException('Invalid MoveIn Id');

    const moveOutRequest = await this.prisma.apartmentClientUser.exists(
      apartmentId,
      {
        where: {
          id: moveOutId,
          clientUserId: userId,
          flatId,
          status: 'approved',
          requestType: 'moveOut',
        },
        select: {
          moveOut: true,
        },
      },
    );

    const moveIn = moment(moveInRequest.createdAt).startOf('day').toDate();
    const moveOut = moment(moveOutRequest?.moveOut).endOf('day').toDate();

    let datesComparision: (
      | { createdAt: { gte: Date; lte?: undefined } }
      | { createdAt: { lte: Date; gte?: undefined } }
    )[];

    if (moveOutRequest && moveOutRequest.moveOut) {
      datesComparision = [
        {
          createdAt: {
            gte: moveIn,
          },
        },
        {
          createdAt: {
            lte: moveOut,
          },
        },
      ];
    } else {
      datesComparision = [
        {
          createdAt: {
            gte: moveIn,
          },
        },
      ];
    }

    const clientUsers = await this.prisma.apartmentClientUser.existMany(
      apartmentId,
      {
        where: {
          flatId,
          AND: datesComparision,
          status: 'approved',
        },
        orderBy: {
          createdAt: 'desc',
        },
        distinct: ['clientUserId'],
        select: {
          type: true,
          clientUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    );

    const owner = clientUsers.find((i) => i.type === 'owner');
    const tenant = clientUsers.find((i) => i.type === 'tenant');

    switch (type) {
      case 'family_members': {
        const members = await this.prisma.clientUser.findMany({
          where: {
            flats: {
              some: {
                id: flatId,
              },
            },

            clientApartments: {
              some: {
                type: {
                  in: ['owner_family', 'tenant_family'],
                },
                flatId,
                status: 'approved',
                AND: datesComparision,
              },
            },
          },
          select: {
            name: true,
            age: true,
            gender: true,
            image: {
              select: {
                url: true,
              },
            },
            createdAt: true,
            clientApartments: {
              where: {
                flatId,
                status: 'approved',
                AND: datesComparision,
              },
              select: {
                type: true,
                verifiedBy: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return members.map((item) => {
          return {
            ...item,
            clientApartments: undefined,
            userType:
              item.clientApartments[0].type === 'owner_family'
                ? 'Owner'
                : 'Tenant',
            user:
              item.clientApartments[0].type === 'owner_family'
                ? owner?.clientUser
                : tenant?.clientUser,
          };
        });
      }

      case 'pets': {
        const pets = await this.prisma.pet.findMany({
          where: {
            flatId,
            AND: datesComparision,
          },
          select: {
            name: true,
            gender: true,
            age: true,
            breed: true,
            typee: true,
            image: {
              select: {
                url: true,
              },
            },
            clientUser: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return pets.map((item) => {
          const user = clientUsers.find(
            (user) => user.clientUser.id === item.clientUser.id,
          );

          return {
            ...item,
            userType:
              user?.type === 'owner' || user?.type === 'owner_family'
                ? 'Owner'
                : 'Tenant',
            user,
          };
        });
      }
      case 'vehicles': {
        const vehicles = await this.prisma.vehicle.findMany({
          where: {
            flatId,
            AND: datesComparision,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            name: true,
            type: true,
            noplate: true,
            image: {
              select: {
                url: true,
              },
            },
            clientUser: {
              select: {
                id: true,
                name: true,
              },
            },
            createdAt: true,
          },
        });

        return vehicles.map((item) => {
          const user = clientUsers.find(
            (user) => user.clientUser.id === item.clientUser.id,
          );

          return {
            ...item,
            userType:
              user?.type === 'owner' || user?.type === 'owner_family'
                ? 'Owner'
                : 'Tenant',
            user,
          };
        });
      }

      case 'staffs': {
        const staffs = await this.prisma.clientStaff.existMany(apartmentId, {
          where: {
            status: 'approved',
            approvedByAdmin: true,
            clientStaffLogs: {
              some: {
                flatId,
                AND: datesComparision,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            name: true,
            contact: true,
            personalStaffRole: {
              select: {
                name: true,
              },
            },
            createdBy: {
              select: {
                name: true,
              },
            },
            createdByType: true,
            image: {
              select: {
                url: true,
              },
            },
            clientStaffLogs: {
              where: {
                flatId,
              },
              take: 1,
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                clientUserType: true,
                clientUser: {
                  select: {
                    name: true,
                  },
                },
                createdAt: true,
              },
            },
          },
        });

        return staffs.map((item) => ({
          ...item.clientStaffLogs[0],
          clientStaff: {
            ...item,
            clientStaffLogs: undefined,
          },
        }));
      }

      case 'visitors': {
        if (visitorType !== 'mass_entry') {
          const visitors = await this.prisma.checkInOut.existMany(apartmentId, {
            where: {
              AND: datesComparision,
              type: visitorType === 'current' ? 'checkin' : 'checkout',
              requestType: {
                in: ['guest', 'delivery', 'ride', 'service'],
              },
              flats: {
                some: {
                  id: flatId,
                },
              },
              requests:
                visitorType === 'current'
                  ? {
                      some: {
                        flatId,
                        status: 'approved',
                      },
                    }
                  : undefined,
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              type: true,
              requestType: true,
              image: true,
              vehicleNo: true,
              vehicleType: true,
              guest: {
                select: {
                  name: true,
                  contact: true,
                  type: true,
                  createdAt: true,
                  startDate: true,
                  endDate: true,
                  status: true,
                  isOneDay: true,
                  createdBy: {
                    select: {
                      name: true,
                    },
                  },
                  checkInOuts: {
                    select: {
                      type: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
              ride: {
                select: {
                  riderName: true,
                  contact: true,
                  type: true,
                  createdAt: true,
                  fromDate: true,
                  toDate: true,
                  status: true,
                  createdBy: {
                    select: {
                      name: true,
                    },
                  },
                  checkInOuts: {
                    select: {
                      type: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
              delivery: {
                select: {
                  name: true,
                  contact: true,
                  type: true,
                  createdAt: true,
                  fromDate: true,
                  toDate: true,
                  status: true,
                  images: true,
                  createdBy: {
                    select: {
                      name: true,
                    },
                  },
                  checkInOuts: {
                    select: {
                      type: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
              service: {
                select: {
                  name: true,
                  contact: true,
                  type: true,
                  serviceType: {
                    select: {
                      name: true,
                    },
                  },
                  createdAt: true,
                  fromDate: true,
                  toDate: true,
                  status: true,
                  createdBy: {
                    select: {
                      name: true,
                    },
                  },
                  checkInOuts: {
                    select: {
                      type: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
              flatJson: true,
              parentJson: true,
              createdAt: true,
              createdByType: true,
              createdByGuard: {
                select: {
                  id: true,
                  name: true,
                },
              },
              requests: {
                select: {
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
                },
              },
            },
          });

          const unfiltered = visitors.map((item) => {
            let parent;
            let requestType;

            if (visitorType === 'current') {
              if (item.requestType === 'guest') {
                if (!item.guest) return null;
                parent = {
                  ...item.guest,
                  fromDate: item.guest.startDate,
                  toDate: item.guest.endDate,
                };
                requestType = 'guest';

                const checkOut = item.guest.checkInOuts.find(
                  (i) => i.type === 'checkout',
                );

                if (checkOut) return null;
              } else if (item.requestType === 'ride') {
                if (!item.ride) return null;
                parent = {
                  ...item.ride,
                  name: item.ride.riderName,
                };
                requestType = 'ride';

                const checkOut = item.ride.checkInOuts.find(
                  (i) => i.type === 'checkout',
                );

                if (checkOut) return null;
              } else if (item.requestType === 'delivery') {
                if (!item.delivery) return null;

                parent = item.delivery;
                requestType = 'delivery';

                const checkOut = item.delivery.checkInOuts.find(
                  (i) => i.type === 'checkout',
                );

                if (checkOut) return null;
              } else {
                if (!item.service) return null;

                parent = item.service;
                requestType = item.service.serviceType.name;

                const checkOut = item.service.checkInOuts.find(
                  (i) => i.type === 'checkout',
                );

                if (checkOut) return null;
              }
            } else {
              if (item.requestType === 'guest') {
                if (!item.guest) return null;

                parent = item.guest;
                requestType = 'guest';
              } else if (item.requestType === 'ride') {
                if (!item.ride) return null;

                parent = {
                  ...item.ride,
                  name: item.ride.riderName,
                };
                requestType = 'ride';
              } else if (item.requestType === 'delivery') {
                if (!item.delivery) return null;

                parent = item.delivery;
                requestType = 'delivery';
              } else {
                if (!item.service) return null;

                parent = item.service;
                requestType = item.service.serviceType.name;
              }
            }

            if (!parent) return null;

            return {
              ...item,
              guest: undefined,
              ride: undefined,
              delivery: undefined,
              service: undefined,
              parent,
              requestType,
              requests: undefined,
              userType:
                requestType === 'guest'
                  ? item.guest?.isOneDay
                    ? 'Short term Visitor'
                    : 'Long term Visitor'
                  : '',
            };
          });

          return unfiltered.filter((i) => i);
        }
        //! in the case of mass entry
        else {
          const entries = await this.prisma.guestMass.findMany({
            where: {
              AND: datesComparision,
              flatId,
            },
            include: {
              createdBy: {
                select: {
                  name: true,
                },
              },
              checkInOuts: {
                select: {
                  createdByType: true,
                  createdByGuard: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });

          return entries;
        }
      }

      default:
        throw new BadRequestException('Invalid Request Type');
    }
  }

  async getAllArchive(data: GetAllParams) {
    const { withId } = data;

    const valid = await this.prisma.block.findUnique({
      where: { id: withId },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const flat = await this.prisma.flat.findMany({
      where: {
        archive: true,
        floor: {
          blockId: withId,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        floor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const flats = await Promise.all(
      flat.map(async (i) => {
        const familyMemberCount = await this.prisma.clientUser.count({
          where: {
            family: true,
            flats: {
              some: {
                id: i.id,
              },
            },
          },
        });

        const staffCount = await this.prisma.clientStaff.count({
          where: {
            status: 'approved',
            flats: {
              some: {
                id: i.id,
              },
            },
          },
        });

        const tenantCount = await this.prisma.apartmentClientUser.count({
          where: {
            status: 'approved',
            flatId: i.id,
            type: 'tenant',
          },
        });

        const owner = await this.prisma.apartmentClientUser.findFirst({
          where: {
            status: 'approved',
            flatId: i.id,
            type: 'owner',
          },
          select: {
            clientUser: {
              select: {
                name: true,
              },
            },
          },
        });

        const tenant = await this.prisma.apartmentClientUser.findFirst({
          where: {
            status: 'approved',
            flatId: i.id,
            type: 'tenant',
          },
          select: {
            clientUser: {
              select: {
                name: true,
              },
            },
          },
        });

        const result = {
          ...i,
          familyMemberCount,
          staffCount,
          tenantCount,
          owner: owner ? owner.clientUser : null,
          tenant: tenant ? tenant.clientUser : null,
        };

        return result;
      }),
    );

    return { name: valid.name, flats };
  }
}
