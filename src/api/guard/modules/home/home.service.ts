import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, UpdateParams } from '../../common/interface';
import moment from 'moment';
import { setDefaultSurveillanceDto } from './dtos/set-defaultSurveillance.dto';
import { capitalize } from 'lodash';
import { getTimeDifference } from 'src/common/utils/time-difference';
import { getVisitorsInOutDto } from './dtos/get-visitorsinout.dto';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultSurveillance(data: CurrentGuardUser) {
    const suerveillance = await this.prisma.surveillance.findUnique({
      where: {
        id: data?.defaultSurveillanceId
          ? data.defaultSurveillanceId
          : data.surveillanceId,
      },
    });

    return suerveillance?.name ? suerveillance.name : '';
  }

  async setDefaultSurveillance(data: UpdateParams<setDefaultSurveillanceDto>) {
    const { apartmentId, loggedUserData, postData } = data;

    const { surveillanceId } = postData;

    const validSurveillance = await this.prisma.surveillance.exists(
      apartmentId,
      {
        where: {
          id: surveillanceId,
        },
      },
    );

    if (!validSurveillance)
      throw new NotFoundException('Surveillance not found');

    const updated = await this.prisma.guardUser.update({
      where: {
        id: loggedUserData.id,
      },
      data: {
        defaultSurveillanceId: surveillanceId,
      },
    });

    return updated;
  }

  async getVisitors(data: GetAllParams) {
    const visitors = await this.prisma.checkInOut.existMany(data.apartmentId, {
      where: {
        requestType: {
          in: ['guest', 'delivery', 'ride', 'service'],
        },
        type: 'checkin',
        requests: {
          some: {
            status: 'approved',
            hasGuardCheckedIn: true,
          },
        },
        OR: [
          {
            requestType: 'guest',
            guest: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
          {
            requestType: 'delivery',
            delivery: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
          {
            requestType: 'ride',
            ride: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
          {
            requestType: 'service',
            service: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        type: true,
        requestType: true,
        createdAt: true,
        updatedAt: true,
        createdByType: true,
        image: true,
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
        surveillance: {
          select: {
            name: true,
          },
        },
        vehicleNo: true,
        vehicleType: true,
        createdByGuard: {
          select: {
            name: true,
          },
        },
        requests: {
          select: {
            status: true,
            type: true,
            approvedByGuard: {
              select: {
                name: true,
                createdAt: true,
              },
            },
            updatedAt: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            contact: true,
            noOfGuests: true,
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
        },
        delivery: {
          select: {
            id: true,
            name: true,
            contact: true,
            images: true,
            serviceProvider: {
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
        ride: {
          select: {
            id: true,
            riderName: true,
            contact: true,
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
        },
        service: {
          select: {
            id: true,
            name: true,
            contact: true,
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const nonfiltered = await Promise.all(
      visitors.map(async (visitor) => {
        const existCheckOut = await this.prisma.checkInOut.findFirst({
          where: {
            NOT: {
              id: visitor.id,
            },
            requestType: visitor.requestType,
            type: 'checkout',
            guestId: visitor.guest?.id,
            deliveryId: visitor.delivery?.id,
            rideId: visitor.ride?.id,
            serviceId: visitor.service?.id,
            createdAt: {
              gt: visitor.createdAt,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (existCheckOut) return undefined;

        let blockInfo = '';
        if (visitor.requestType === 'service' && visitor.service) {
          blockInfo = `${capitalize(visitor.service.flat.floor.block.name)}: ${capitalize(visitor.service.flat.name)}`;
        } else if (visitor.requestType === 'guest' && visitor.guest) {
          blockInfo = `${capitalize(visitor.guest.flat.floor.block.name)}: ${capitalize(visitor.guest.flat.name)}`;
        } else if (visitor.requestType === 'delivery' && visitor.delivery) {
          blockInfo = visitor.flats.reduce((acc: string, curr) => {
            return `${acc} ${capitalize(curr.floor.block.name)}: ${capitalize(curr.name)}, `;
          }, '' as string);
        } else if (visitor.requestType === 'ride' && visitor.ride) {
          blockInfo = `${capitalize(visitor.ride.flat.floor.block.name)}: ${capitalize(visitor.ride.flat.name)}`;
        } else {
          blockInfo = '';
        }

        let duration = '';

        if (visitor.type === 'checkin') {
          duration = getTimeDifference(
            visitor.requests[0].updatedAt ?? visitor.updatedAt,
            new Date(),
          );
        } else if (visitor.type === 'checkout') {
          const lastCheckIn = await this.prisma.checkInOut.exists(
            data.apartmentId,
            {
              where: {
                type: 'checkin',
                requestType: visitor.requestType,
                rideId:
                  visitor.requestType === 'ride' ? visitor.ride?.id : undefined,
                deliveryId:
                  visitor.requestType === 'delivery'
                    ? visitor.delivery?.id
                    : undefined,
                guestId:
                  visitor.requestType === 'guest'
                    ? visitor.guest?.id
                    : undefined,
                serviceId:
                  visitor.requestType === 'service'
                    ? visitor.service?.id
                    : undefined,
              },
              orderBy: {
                createdAt: 'desc',
              },
              include: {
                requests: {
                  take: 1,
                  select: {
                    updatedAt: true,
                  },
                },
              },
            },
          );

          if (lastCheckIn) {
            duration = getTimeDifference(
              lastCheckIn.requests[0].updatedAt ?? lastCheckIn.updatedAt,
              visitor.updatedAt,
            );
          }
        }

        return {
          ...visitor,
          createdAt: visitor.requests[0].updatedAt ?? visitor.updatedAt,
          blockInfo,
          duration,
        };
      }),
    );

    const res = nonfiltered
      .filter((i): i is NonNullable<typeof i> => i !== undefined)
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

    return res;
  }

  async getVisitorsInsideOutside(data: GetAllParams<getVisitorsInOutDto>) {
    const { extended } = data;

    const today = moment().startOf('day').toDate();

    const visitors = await this.prisma.checkInOut.existMany(data.apartmentId, {
      where: {
        requestType:
          !extended?.requestType || extended.requestType === 'all'
            ? {
                in: ['guest', 'delivery', 'ride', 'service'],
              }
            : extended.requestType,
        // OR: [
        //   {
        //     type: 'checkin',
        //     requests: {
        //       some: {
        //         status: 'approved',
        //         hasGuardCheckedIn: true,
        //       },
        //     },
        //   },
        //   {
        //     type: 'checkout',
        //   },
        // ],
      },
      select: {
        id: true,
        type: true,
        requestType: true,
        createdAt: true,
        updatedAt: true,
        createdByType: true,
        image: true,
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
        surveillance: {
          select: {
            name: true,
          },
        },
        vehicleNo: true,
        vehicleType: true,
        createdByGuard: {
          select: {
            name: true,
          },
        },
        requests: {
          select: {
            status: true,
            type: true,
            hasGuardCheckedIn: true,
            approvedByGuard: {
              select: {
                name: true,
                createdAt: true,
              },
            },
            updatedAt: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            contact: true,
            noOfGuests: true,
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
        },
        delivery: {
          select: {
            id: true,
            name: true,
            contact: true,
            images: true,
            serviceProvider: {
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
        ride: {
          select: {
            id: true,
            riderName: true,
            contact: true,
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
        },
        service: {
          select: {
            id: true,
            name: true,
            contact: true,
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const inside: any[] = [];
    const outside: any[] = [];

    visitors.map((visitor) => {
      if (visitor.type === 'checkin') {
        if (
          !visitor.requests ||
          !visitor.requests.every((i) => i.hasGuardCheckedIn)
        )
          return;
      }

      const existInCheckIn = inside.find(
        (i) =>
          // i.id !== visitor.id &&
          // i.requestType === visitor.requestType &&
          (i.guest && i.guest?.id === visitor.guest?.id) ||
          (i.delivery && i.delivery?.id === visitor.delivery?.id) ||
          (i.ride && i.ride?.id === visitor.ride?.id) ||
          (i.service && i.service?.id === visitor.service?.id),
      );

      const existInCheckOut = outside.find(
        (i) =>
          // i.id !== visitor.id &&
          // i.requestType === visitor.requestType &&
          (i.guest && i.guest?.id === visitor.guest?.id) ||
          (i.delivery && i.delivery?.id === visitor.delivery?.id) ||
          (i.ride && i.ride?.id === visitor.ride?.id) ||
          (i.service && i.service?.id === visitor.service?.id),
      );

      if (existInCheckIn || existInCheckOut) return undefined;

      let blockInfo = '';
      if (visitor.requestType === 'service' && visitor.service) {
        blockInfo = `${capitalize(visitor.service.flat.floor.block.name)}: ${capitalize(visitor.service.flat.name)}`;
      } else if (visitor.requestType === 'guest' && visitor.guest) {
        blockInfo = `${capitalize(visitor.guest.flat.floor.block.name)}: ${capitalize(visitor.guest.flat.name)}`;
      } else if (visitor.requestType === 'delivery' && visitor.delivery) {
        blockInfo = visitor.flats.reduce((acc: string, curr) => {
          return `${acc} ${capitalize(curr.floor.block.name)}: ${capitalize(curr.name)}, `;
        }, '' as string);
      } else if (visitor.requestType === 'ride' && visitor.ride) {
        blockInfo = `${capitalize(visitor.ride.flat.floor.block.name)}: ${capitalize(visitor.ride.flat.name)}`;
      } else {
        blockInfo = '';
      }

      let duration = '';
      let updatedAt = '';

      if (visitor.type === 'checkin') {
        duration = getTimeDifference(
          visitor.requests && visitor.requests.length > 0
            ? (visitor.requests[0].updatedAt ?? visitor.updatedAt)
            : visitor.updatedAt,
          new Date(),
        );
      } else if (visitor.type === 'checkout') {
        const lastCheckIn = visitors.find(
          (i) =>
            i.id !== visitor.id &&
            i.requestType === visitor.requestType &&
            ((i.guest && i.guest?.id === visitor.guest?.id) ||
              (i.delivery && i.delivery?.id === visitor.delivery?.id) ||
              (i.ride && i.ride?.id === visitor.ride?.id) ||
              (i.service &&
                i.service?.id === visitor.service?.id &&
                i.createdAt < visitor.createdAt)),
        );

        if (lastCheckIn) {
          duration = getTimeDifference(
            lastCheckIn.requests[0].updatedAt ?? lastCheckIn.updatedAt,
            visitor.createdAt,
          );
          updatedAt =
            lastCheckIn.requests[0]?.updatedAt?.toISOString() ??
            lastCheckIn.updatedAt.toISOString();
        } else {
          // If no matching check-in found, calculate duration from visitor's creation time
          duration = getTimeDifference(
            visitor.requests[0].updatedAt || visitor.updatedAt,
            new Date(),
          );
          updatedAt =
            visitor.requests[0]?.updatedAt?.toISOString() ??
            visitor.updatedAt.toISOString();
        }
      }

      if (visitor.type === 'checkin') {
        inside.push({
          ...visitor,
          blockInfo,
          duration,
          createdAt: visitor.requests[0].updatedAt ?? visitor.updatedAt,
        });
        return;
      } else {
        outside.push({
          ...visitor,
          blockInfo,
          duration,
          updatedAt,
        });
        return;
      }
    });

    return {
      inside: inside.filter((i) => i),
      outside: outside.filter((i) => i.createdAt >= today),
    };
  }

  async getVisitorsInsideOutsideV2(data: GetAllParams<getVisitorsInOutDto>) {
    const { extended } = data;
    const today = moment().startOf('day').toDate();

    const [inside, outside] = await Promise.all([
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType:
            !extended?.requestType || extended.requestType === 'all'
              ? {
                  in: ['guest', 'delivery', 'ride', 'service'],
                }
              : extended.requestType,
          requests: {
            some: {
              status: 'approved',
              hasGuardCheckedIn: true,
            },
          },
          type: 'checkin',
          OR: [
            {
              requestType: 'guest',
              guest: {
                checkInOuts: {
                  none: {
                    type: 'checkout',
                  },
                },
              },
            },
            {
              requestType: 'delivery',
              delivery: {
                checkInOuts: {
                  none: {
                    type: 'checkout',
                  },
                },
              },
            },
            {
              requestType: 'ride',
              ride: {
                checkInOuts: {
                  none: {
                    type: 'checkout',
                  },
                },
              },
            },
            {
              requestType: 'service',
              service: {
                checkInOuts: {
                  none: {
                    type: 'checkout',
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          updatedAt: true,
          createdByType: true,
          image: true,
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
          surveillance: {
            select: {
              name: true,
            },
          },
          vehicleNo: true,
          vehicleType: true,
          createdByGuard: {
            select: {
              name: true,
            },
          },
          requests: {
            select: {
              status: true,
              type: true,
              hasGuardCheckedIn: true,
              approvedByGuard: {
                select: {
                  name: true,
                  createdAt: true,
                },
              },
              updatedAt: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              contact: true,
              noOfGuests: true,
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
          },
          delivery: {
            select: {
              id: true,
              name: true,
              contact: true,
              images: true,
              serviceProvider: {
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
          ride: {
            select: {
              id: true,
              riderName: true,
              contact: true,
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
          },
          service: {
            select: {
              id: true,
              name: true,
              contact: true,
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      await this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType:
            !extended?.requestType || extended.requestType === 'all'
              ? {
                  in: ['guest', 'delivery', 'ride', 'service'],
                }
              : extended.requestType,
          type: 'checkout',
          createdAt: {
            gte: today,
          },
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          updatedAt: true,
          createdByType: true,
          image: true,
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
          surveillance: {
            select: {
              name: true,
            },
          },
          vehicleNo: true,
          vehicleType: true,
          createdByGuard: {
            select: {
              name: true,
            },
          },
          requests: {
            select: {
              status: true,
              type: true,
              hasGuardCheckedIn: true,
              approvedByGuard: {
                select: {
                  name: true,
                  createdAt: true,
                },
              },
              updatedAt: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              contact: true,
              noOfGuests: true,
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
          },
          delivery: {
            select: {
              id: true,
              name: true,
              contact: true,
              images: true,
              serviceProvider: {
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
          ride: {
            select: {
              id: true,
              riderName: true,
              contact: true,
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
          },
          service: {
            select: {
              id: true,
              name: true,
              contact: true,
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const modifiedInside = inside.map((visitor) => {
      let blockInfo = '';
      if (visitor.requestType === 'service' && visitor.service) {
        blockInfo = `${capitalize(visitor.service.flat.floor.block.name)}: ${capitalize(visitor.service.flat.name)}`;
      } else if (visitor.requestType === 'guest' && visitor.guest) {
        blockInfo = `${capitalize(visitor.guest.flat.floor.block.name)}: ${capitalize(visitor.guest.flat.name)}`;
      } else if (visitor.requestType === 'delivery' && visitor.delivery) {
        blockInfo = visitor.flats.reduce((acc: string, curr) => {
          return `${acc} ${capitalize(curr.floor.block.name)}: ${capitalize(curr.name)}, `;
        }, '' as string);
      } else if (visitor.requestType === 'ride' && visitor.ride) {
        blockInfo = `${capitalize(visitor.ride.flat.floor.block.name)}: ${capitalize(visitor.ride.flat.name)}`;
      } else {
        blockInfo = '';
      }

      let duration = '';

      duration = getTimeDifference(
        visitor.requests && visitor.requests.length > 0
          ? (visitor.requests[0].updatedAt ?? visitor.updatedAt)
          : visitor.updatedAt,
        new Date(),
      );

      return {
        ...visitor,
        blockInfo,
        duration,
        createdAt: visitor.requests[0].updatedAt ?? visitor.updatedAt,
      };
    });

    const modifiedOutside = await Promise.all(
      outside.map(async (visitor) => {
        let blockInfo = '';
        if (visitor.requestType === 'service' && visitor.service) {
          blockInfo = `${capitalize(visitor.service.flat.floor.block.name)}: ${capitalize(visitor.service.flat.name)}`;
        } else if (visitor.requestType === 'guest' && visitor.guest) {
          blockInfo = `${capitalize(visitor.guest.flat.floor.block.name)}: ${capitalize(visitor.guest.flat.name)}`;
        } else if (visitor.requestType === 'delivery' && visitor.delivery) {
          blockInfo = visitor.flats.reduce((acc: string, curr) => {
            return `${acc} ${capitalize(curr.floor.block.name)}: ${capitalize(curr.name)}, `;
          }, '' as string);
        } else if (visitor.requestType === 'ride' && visitor.ride) {
          blockInfo = `${capitalize(visitor.ride.flat.floor.block.name)}: ${capitalize(visitor.ride.flat.name)}`;
        } else {
          blockInfo = '';
        }

        let duration = '';
        let updatedAt = '';

        const lastCheckIn = await this.prisma.checkInOut.findFirst({
          where: {
            type: 'checkin',
            requestType: visitor.requestType,
            rideId:
              visitor.requestType === 'ride' ? visitor.ride?.id : undefined,
            deliveryId:
              visitor.requestType === 'delivery'
                ? visitor.delivery?.id
                : undefined,
            guestId:
              visitor.requestType === 'guest' ? visitor.guest?.id : undefined,
            serviceId:
              visitor.requestType === 'service'
                ? visitor.service?.id
                : undefined,
            createdAt: {
              lte: visitor.createdAt,
            },
          },
          select: {
            createdAt: true,
            updatedAt: true,
            requests: {
              take: 1,
              where: {
                hasGuardCheckedIn: true,
              },
              select: {
                updatedAt: true,
              },
            },
          },
        });

        if (lastCheckIn) {
          duration = getTimeDifference(
            lastCheckIn.requests[0].updatedAt ?? lastCheckIn.updatedAt,
            visitor.createdAt,
          );
          updatedAt =
            lastCheckIn.requests[0]?.updatedAt?.toISOString() ??
            lastCheckIn.updatedAt.toISOString();
        }

        return {
          ...visitor,
          blockInfo,
          duration,
          updatedAt,
        };
      }),
    );

    return {
      inside: modifiedInside,
      outside: modifiedOutside,
    };
  }

  async getResidentalStaffInOut(data: GetAllParams) {
    const lastWeek = moment().subtract('week', 1).startOf('day').toDate();

    const [checkIns, checkOuts, count] = await Promise.all([
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'clientstaff',
          type: 'checkin',
          createdAt: {
            gte: lastWeek,
          },
        },
        distinct: ['clientStaffId'],
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          clientStaffId: true,
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
          createdByGuard: {
            select: {
              name: true,
            },
          },
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'clientstaff',
          type: 'checkout',
          createdAt: {
            gte: lastWeek,
          },
        },
        distinct: ['clientStaffId'],
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          clientStaffId: true,
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
          createdByGuard: {
            select: {
              name: true,
            },
          },
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
            },
          },
        },
      }),
      this.prisma.clientStaff.count({
        where: {
          apartmentId: data.apartmentId,
          archive: false,
          approvedByAdmin: true,
        },
      }),
    ]);

    // Filter out duplicate check-ins for the same client staff
    const inside = checkIns.reduce((acc, curr) => {
      const exists = checkOuts.find(
        (checkOut) => checkOut.clientStaffId === curr.clientStaffId,
      );

      // CheckOut Exist
      if (exists) {
        if (exists.createdAt > curr.createdAt) return acc;
      }

      // Add the check-in to the inside array
      acc.push({
        ...curr,
        enteredAt: '',
        flats: undefined,
        blockInfo: curr.flats.reduce((acc: string, curr) => {
          return `${acc} ${capitalize(curr.floor.block.name)}: ${capitalize(curr.name)}`;
        }, '' as string),
        clientStaffId: undefined,
        clientStaff: undefined,
        user: {
          ...curr.clientStaff,
          role: curr.clientStaff?.personalStaffRole,
        },
        userId: curr.clientStaffId,
      });

      return acc;
    }, [] as any[]);

    // Initialize an array `outside` by reducing the `checkOuts` array
    const outside = checkOuts.reduce((acc, curr) => {
      // If the current checkOut does not have a `clientStaff`, skip it and continue with the next one
      if (!curr.clientStaff) return acc;

      // Check if the current checkOut's `clientStaffId` exists in the `inside` array
      const existInside = inside.find(
        (checkIn) => checkIn.userId === curr.clientStaffId,
      );

      // If the `clientStaffId` exists in the `inside` array, skip the current checkOut and continue with the next one
      if (existInside) return acc;

      const reverseCheckIns = checkIns.map((i) => i);
      const lastCheckIn = reverseCheckIns.find(
        (i) =>
          +i.createdAt < +curr.createdAt &&
          i.clientStaffId === curr.clientStaffId,
      );

      // If none of the above conditions are met, add the current checkOut to the `outside` array, but with `clientStaffId` and `clientStaff` set to `undefined`, and `user` and `userId` set to `clientStaff` and `clientStaffId` respectively
      acc.push({
        ...curr,
        enteredAt: lastCheckIn?.createdAt ? lastCheckIn.createdAt : '',
        flats: undefined,
        blockInfo: curr.flats.reduce((acc: string, curr) => {
          return `${acc} ${capitalize(curr.floor.block.name)}: ${capitalize(curr.name)}`;
        }, '' as string),
        clientStaffId: undefined,
        clientStaff: undefined,
        user: {
          ...curr.clientStaff,
          role: curr.clientStaff.personalStaffRole,
        },
        userId: curr.clientStaffId,
      });

      // Return the accumulated array to be used in the next iteration
      return acc;
    }, [] as any[]); // Start with an empty array

    // Return an object containing the `inside` array, the `outside` array, and the `count` variable
    return {
      inside,
      outside,
      count,
    };
  }

  async getSocietyStaffInOut(data: GetAllParams) {
    const lastWeek = moment().subtract('week', 1).startOf('day').toDate();

    const [checkIns, checkOuts, count] = await Promise.all([
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'adminservice',
          type: 'checkin',
          createdAt: {
            gte: lastWeek,
          },
        },
        distinct: ['adminserviceId'],
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          adminserviceId: true,
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
          createdByGuard: {
            select: {
              name: true,
            },
          },
          surveillance: {
            select: {
              name: true,
            },
          },
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'adminservice',
          type: 'checkout',
          createdAt: {
            gte: lastWeek,
          },
        },
        distinct: ['adminserviceId'],
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          adminserviceId: true,
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
          createdByGuard: {
            select: {
              name: true,
            },
          },
          surveillance: {
            select: {
              name: true,
            },
          },
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
        },
      }),
      this.prisma.adminService.count({
        where: {
          apartmentId: data.apartmentId,
          archive: false,
        },
      }),
    ]);

    const inside = checkIns.reduce((acc, curr) => {
      if (!curr.adminserviceId) return acc;

      const exists = checkOuts.find(
        (checkOut) => checkOut.adminserviceId === curr.adminserviceId,
      );

      // CheckOut Exist
      if (exists) {
        if (exists.createdAt > curr.createdAt) return acc;
      }

      acc.push({
        ...curr,
        enteredAt: '',
        flats: undefined,
        blockInfo: '',
        adminserviceId: undefined,
        adminService: undefined,
        userId: curr.adminserviceId,
        user: curr.adminService,
      });

      return acc;
    }, [] as any[]);

    const outside = checkOuts.reduce((acc, curr) => {
      if (!curr.adminserviceId) return acc;

      const existInside = inside.find(
        (checkIn) => checkIn.userId === curr.adminserviceId,
      );

      if (existInside) return acc;

      const lastCheckIn = checkIns.find(
        (i) =>
          i.createdAt < curr.createdAt &&
          i.adminserviceId === curr.adminserviceId,
      );

      acc.push({
        ...curr,
        enteredAt: lastCheckIn?.createdAt ? lastCheckIn.createdAt : '',
        flats: undefined,
        blockInfo: '',
        adminserviceId: undefined,
        adminService: undefined,
        userId: curr.adminserviceId,
        user: curr.adminService,
      });

      return acc;
    }, [] as any[]);

    return {
      inside,
      outside,
      count,
    };
  }

  async getVehiclesInOut(data: GetAllParams) {
    const lastWeek = moment().subtract('week', 1).startOf('day').toDate();

    const [checkIns, checkOuts, count] = await Promise.all([
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'vehicle',
          type: 'checkin',
          createdAt: {
            gte: lastWeek,
          },
        },
        distinct: ['vehicleId'],
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          vehicleId: true,
          createdByGuard: {
            select: {
              name: true,
            },
          },
          surveillance: {
            select: {
              name: true,
            },
          },
          vehicle: {
            select: {
              name: true,
              contact: true,
              vehicleNumber: true,
              vehicle: {
                select: {
                  name: true,
                  image: { select: { url: true } },
                },
              },
              checkInOuts: { select: { image: true }, take: 1 },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'vehicle',
          type: 'checkout',
          createdAt: {
            gte: lastWeek,
          },
        },
        distinct: ['vehicleId'],

        select: {
          id: true,
          type: true,
          requestType: true,
          vehicleId: true,
          createdAt: true,
          createdByGuard: {
            select: {
              name: true,
            },
          },
          surveillance: {
            select: {
              name: true,
            },
          },
          vehicle: {
            select: {
              name: true,
              contact: true,
              vehicleNumber: true,
              vehicle: {
                select: {
                  name: true,
                  image: { select: { url: true } },
                },
              },
              checkInOuts: { select: { image: true }, take: 1 },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.checkInOut.count({
        where: {
          apartmentId: data.apartmentId,
          requestType: 'vehicle',
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
    ]);

    const inside = checkIns.reduce((acc, curr) => {
      if (!curr.vehicleId) return acc;

      const exists = checkOuts.find(
        (checkOut) => checkOut.vehicleId === curr.vehicleId,
      );

      // CheckOut Exist
      if (exists) {
        if (exists.createdAt > curr.createdAt) return acc;
      }

      acc.push({
        ...curr,
        enteredAt: '',
        flats: undefined,
        blockInfo: '',
        adminserviceId: undefined,
        adminService: undefined,
        userId: curr.vehicleId,
        user: curr.vehicleId,
      });

      return acc;
    }, [] as any[]);

    const outside = checkOuts.reduce((acc, curr) => {
      if (!curr.vehicleId) return acc;

      const existInside = inside.find(
        (checkIn) => checkIn.userId === curr.vehicleId,
      );

      if (existInside) return acc;

      const lastCheckIn = checkIns.find(
        (i) => i.createdAt < curr.createdAt && i.vehicleId === curr.vehicleId,
      );

      acc.push({
        ...curr,
        enteredAt: lastCheckIn?.createdAt ? lastCheckIn.createdAt : '',
        flats: undefined,
        blockInfo: '',
        adminserviceId: undefined,
        adminService: undefined,
        userId: curr.vehicleId,
        user: curr.vehicleId,
      });

      return acc;
    }, [] as any[]);

    return {
      inside,
      outside,
      count,
    };
  }

  async getGroupVisitorsInOut(data: GetAllParams) {
    const lastWeek = moment().subtract('week', 1).startOf('day').toDate();

    const [checkIns, checkOuts, count] = await Promise.all([
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'group',
          type: 'checkin',
          createdAt: {
            gte: lastWeek,
          },
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          groupEntryId: true,
          createdByGuard: {
            select: {
              name: true,
            },
          },
          surveillance: {
            select: {
              name: true,
            },
          },
          groupEntry: {
            select: {
              name: true,
              contact: true,
              vehicleType: true,
              description: true,
              checkInOuts: {
                select: { image: true, vehicleNo: true },
                take: 1,
              },
            },
          },
        },
        distinct: ['groupEntryId'],
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.checkInOut.existMany(data.apartmentId, {
        where: {
          requestType: 'group',
          type: 'checkout',
          createdAt: {
            gte: lastWeek,
          },
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          groupEntryId: true,
          createdAt: true,
          createdByGuard: {
            select: {
              name: true,
            },
          },
          surveillance: {
            select: {
              name: true,
            },
          },
          groupEntry: {
            select: {
              name: true,
              contact: true,
              vehicleType: true,
              description: true,
              checkInOuts: {
                select: { image: true, vehicleNo: true },
                take: 1,
              },
            },
          },
        },
        distinct: ['groupEntryId'],
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.checkInOut.count({
        where: {
          apartmentId: data.apartmentId,
          requestType: 'group',
          createdAt: {
            gte: lastWeek,
          },
        },
      }),
    ]);

    const inside = checkIns.reduce((acc, curr) => {
      //Do same if no id
      if (!curr.groupEntryId) return acc;

      const exists = checkOuts.find(
        (checkOut) => checkOut.groupEntryId === curr.groupEntryId,
      );

      // If check-out record exists and it was created after the current check-in record, it means the visitor has already checked out, so the current check-in record is skipped.
      if (exists) {
        if (exists.createdAt > curr.createdAt) return acc;
      }

      acc.push({
        ...curr,
        enteredAt: '',
        flats: undefined,
        blockInfo: '',
        adminserviceId: undefined,
        adminService: undefined,
        userId: curr.groupEntryId,
        user: curr.groupEntryId,
      });

      return acc;
    }, [] as any[]);

    const outside = checkOuts.reduce((acc, curr) => {
      if (!curr.groupEntryId) return acc;

      const existInside = inside.find(
        (checkIn) => checkIn.userId === curr.groupEntryId,
      );

      if (existInside) return acc;

      const lastCheckIn = checkIns.find(
        (i) =>
          i.createdAt < curr.createdAt && i.groupEntryId === curr.groupEntryId,
      );

      acc.push({
        ...curr,
        enteredAt: lastCheckIn?.createdAt ? lastCheckIn.createdAt : '',
        flats: undefined,
        blockInfo: '',
        adminserviceId: undefined,
        adminService: undefined,
        userId: curr.groupEntryId,
        user: curr.groupEntryId,
      });

      return acc;
    }, [] as any[]);

    return {
      inside,
      outside,
      count,
    };
  }
}
