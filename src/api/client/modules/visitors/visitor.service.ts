import { Injectable } from '@nestjs/common';
import { AssignedUserParam } from '../../common/interfaces';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { getTimeDifference } from 'src/common/utils/time-difference';
import moment from 'moment';
import { $Enums } from '@prisma/client';
@Injectable()
export class VisitorService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisitors({ user }: AssignedUserParam.GetAll) {
    const visitors = await this.prisma.checkInOut.existMany(user.apartmentId, {
      where: {
        requestType: {
          in: ['guest', 'delivery', 'ride', 'service'],
        },
        type: 'checkin',
        OR: [
          {
            guest: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
          {
            delivery: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
          {
            ride: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
          {
            service: {
              checkInOuts: {
                none: {
                  type: 'checkout',
                },
              },
            },
          },
        ],
        requests: {
          some: {
            status: 'approved',
            hasGuardCheckedIn: true,
            flatId: user.flatId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      distinct: ['guestId', 'deliveryId', 'rideId', 'serviceId'],
      select: {
        id: true,
        type: true,
        requestType: true,
        updatedAt: true,
        createdAt: true,
        image: true,
        vehicleNo: true,
        vehicleType: true,
        createdByGuard: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        requests: {
          select: {
            status: true,
            type: true,
            approvedByGuard: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                  },
                },
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
          },
        },
        ride: {
          select: {
            id: true,
            riderName: true,
            contact: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            contact: true,
          },
        },
      },
    });

    return visitors.map((i) => ({
      id: i.id,
      requestType: i.requestType,
      name:
        i.requestType === 'delivery'
          ? i.delivery?.name
          : i.requestType === 'ride'
            ? i.ride?.riderName
            : i.requestType === 'service'
              ? i.service?.name
              : i.guest?.name,
      image: i.image,
      enteredAt: i.requests[0].updatedAt || i.updatedAt,
      approvedByGuard:
        i.requests.length > 0
          ? i.requests[0].approvedByGuard
          : i.createdByGuard,
      contact: i[i.requestType]?.contact,
    }));
  }

  async getPersonalStaffInOut({ user }: AssignedUserParam.GetAll) {
    const today = moment().startOf('day').toDate();
    const next = moment().startOf('day').add(1, 'day').toDate();
    const [nonSortedCheckIns, nonSortedCheckOuts, count] = await Promise.all([
      this.prisma.checkInOut.existMany(user.apartmentId, {
        where: {
          requestType: 'clientstaff',
          type: 'checkin',
          createdAt: {
            gte: today,
            lte: next,
          },
          flats: {
            some: {
              id: user.flatId,
            },
          },
        },
        select: {
          id: true,
          type: true,
          requestType: true,
          createdAt: true,
          clientStaffId: true,
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
          createdAt: 'asc',
        },
      }),
      this.prisma.checkInOut.existMany(user.apartmentId, {
        where: {
          requestType: 'clientstaff',
          type: 'checkout',
          createdAt: {
            gte: today,
          },
          flats: {
            some: {
              id: user.flatId,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          clientStaffId: true,
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
          apartmentId: user.apartmentId,
          archive: false,
          approvedByAdmin: true,
          status: 'approved',
          flats: {
            some: {
              id: user.flatId,
            },
          },
        },
      }),
    ]);

    const checkIns = nonSortedCheckIns.sort(
      (a, b) => +a.createdAt - +b.createdAt,
    );

    const checkOuts = nonSortedCheckOuts.sort(
      (a, b) => +a.createdAt - +b.createdAt,
    );

    // Filter out duplicate check-ins for the same client staff
    const inside = checkIns.reduce((acc, curr) => {
      const duplicateCheckIn = checkIns
        .map((i) => i)
        .reverse()
        .find((i) => i.clientStaffId === curr.clientStaffId);

      if (duplicateCheckIn && duplicateCheckIn.createdAt > curr.createdAt)
        return acc;

      if (!curr.clientStaff) return acc;

      const existCheckouts = checkOuts.map((i) => i).reverse();

      const exists = existCheckouts.find(
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
        clientStaffId: undefined,
        clientStaff: undefined,
        user: {
          ...curr.clientStaff,
          role: curr.clientStaff.personalStaffRole,
        },
        userId: curr.clientStaffId,
      });

      return acc;
    }, [] as any[]);

    // Initialize an array `outside` by reducing the `checkOuts` array
    const outside = checkOuts.reduce((acc, curr, index) => {
      // Find the index of any duplicate checkOut with the same `clientStaffId`
      const duplicateIndex = checkOuts.findIndex(
        (checkOut) => checkOut.clientStaffId === curr.clientStaffId,
      );

      // A checkOut is considered a duplicate if its index is not -1 (found in the array) and not the same as the current index
      const duplicateCheckOut =
        duplicateIndex !== -1 && duplicateIndex !== index;

      // If the current checkOut is a duplicate, skip it and continue with the next one
      if (duplicateCheckOut) return acc;

      // If the current checkOut does not have a `clientStaff`, skip it and continue with the next one
      if (!curr.clientStaff) return acc;

      // Check if the current checkOut's `clientStaffId` exists in the `inside` array
      const existInside = inside.find(
        (checkIn) => checkIn.userId === curr.clientStaffId,
      );

      // If the `clientStaffId` exists in the `inside` array, skip the current checkOut and continue with the next one
      if (existInside) return acc;

      const reverseCheckIns = checkIns.map((i) => i).reverse();
      const lastCheckIn = reverseCheckIns.find(
        (i) =>
          i.createdAt < curr.createdAt &&
          i.clientStaffId === curr.clientStaffId,
      );

      // If none of the above conditions are met, add the current checkOut to the `outside` array, but with `clientStaffId` and `clientStaff` set to `undefined`, and `user` and `userId` set to `clientStaff` and `clientStaffId` respectively
      acc.push({
        ...curr,
        enteredAt: lastCheckIn?.createdAt ? lastCheckIn.createdAt : '',
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

    const allClientStaff = await this.prisma.clientStaff.findMany({
      where: {
        apartmentId: user.apartmentId,
        archive: false,
        approvedByAdmin: true,
        flats: {
          some: {
            id: user.flatId,
          },
        },
      },
      select: {
        id: true,
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
    });

    const presentClientStaffIds = new Set([
      ...inside.map((checkIn) => checkIn.userId),
      ...outside.map((checkOut) => checkOut.userId),
    ]);

    const notArrived = allClientStaff.filter(
      (staff) => !presentClientStaffIds.has(staff.id),
    );

    // Return an object containing the `inside` array, the `outside` array, and the `count` variable
    return {
      inside,
      outside,
      notArrived,
      count,
    };
  }

  async getMyVisitors({
    user,
    extend,
    page,
    limit,
  }: AssignedUserParam.GetAll<{
    type: 'inside' | 'upcoming' | 'parcel' | 'past' | 'rejected';
    start?: Date;
    end?: Date;
  }>) {
    switch (extend?.type) {
      case 'inside': {
        const today = moment().startOf('day').toDate();
        const next = moment().startOf('day').add(1, 'day').toDate();

        const visitors = await this.prisma.checkInOut.existMany(
          user.apartmentId,
          {
            where: {
              requestType: {
                in: ['guest', 'delivery', 'ride', 'service'],
              },
              type: 'checkin',
              OR: [
                {
                  guest: {
                    checkInOuts: {
                      none: {
                        type: 'checkout',
                      },
                    },
                  },
                },
                {
                  delivery: {
                    checkInOuts: {
                      none: {
                        type: 'checkout',
                      },
                    },
                  },
                },
                {
                  ride: {
                    checkInOuts: {
                      none: {
                        type: 'checkout',
                      },
                    },
                  },
                },
                {
                  service: {
                    checkInOuts: {
                      none: {
                        type: 'checkout',
                      },
                    },
                  },
                },
              ],
              createdAt: {
                gte: today,
                lt: next,
              },
              requests: {
                some: {
                  status: 'approved',
                  hasGuardCheckedIn: true,
                  flatId: user.currentState.flatId,
                },
              },
            },
            select: {
              id: true,
              type: true,
              requestType: true,
              updatedAt: true,
              createdAt: true,
              image: true,
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
                  approvedByUser: {
                    select: {
                      name: true,
                      createdAt: true,
                    },
                  },
                },
              },
              guest: {
                select: {
                  id: true,
                  name: true,
                  contact: true,
                  noOfGuests: true,
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
                      image: {
                        select: {
                          url: true,
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
              service: {
                select: {
                  id: true,
                  name: true,
                  contact: true,
                },
              },
              guestMass: {
                select: {
                  id: true,
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
                  startDate: true,
                  endDate: true,
                  entered: true,
                  total: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

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

            let duration = '';

            if (visitor.type === 'checkin') {
              duration = getTimeDifference(visitor.createdAt, new Date());
            } else if (visitor.type === 'checkout') {
              const lastCheckIn = await this.prisma.checkInOut.exists(
                user.apartmentId,
                {
                  where: {
                    type: 'checkin',
                    requestType: visitor.requestType,
                    rideId:
                      visitor.requestType === 'ride'
                        ? visitor.ride?.id
                        : undefined,
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
                    guestMassId:
                      visitor.requestType === 'guestmass'
                        ? visitor.guestMass?.id
                        : undefined,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  select: {
                    requests: {
                      select: {
                        updatedAt: true,
                      },
                    },
                  },
                },
              );

              if (lastCheckIn) {
                duration = getTimeDifference(
                  lastCheckIn.requests[0].updatedAt || visitor.updatedAt,
                  visitor.updatedAt,
                );
              }
            }

            return {
              ...visitor,
              duration,
            };
          }),
        );

        return nonfiltered.filter((i) => i);
      }

      case 'upcoming': {
        // const today = moment().startOf('day').toDate();
        // const next = moment().startOf('day').add(1, 'day').toDate();

        const [guests, rides, deliveries, services, guestMasses] =
          await Promise.all([
            // guest get
            this.prisma.guest.findMany({
              where: {
                flatId: user.currentState.flatId,
                // startDate: {
                //   gte: today,
                //   lt: next,
                // },
                // endDate: {
                //   gte: today,
                //   lt: next,
                // },
                status: 'pending',
                type: 'preapproved',
              },
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
                name: true,
                contact: true,
                noOfGuests: true,
                startDate: true,
                endDate: true,
                gatePass: {
                  select: {
                    code: true,
                  },
                },
                isOneDay: true,
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
                createdAt: true,
              },
            }),

            // ride get
            this.prisma.ride.findMany({
              where: {
                flatId: user.currentState.flatId,
                status: 'pending',
                type: 'preapproved',

                // fromDate: {
                //   gte: today,
                //   lt: next,
                // },
                // toDate: {
                //   gte: today,
                //   lt: next,
                // },
              },
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
                riderName: true,
                contact: true,
                fromDate: true,
                toDate: true,
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
                createdAt: true,
              },
            }),

            // delivery get
            this.prisma.delivery.findMany({
              where: {
                flats: {
                  some: {
                    id: user.currentState.flatId,
                  },
                },
                status: 'pending',
                type: 'preapproved',
                // fromDate: {
                //   gte: today,
                //   lt: next,
                // },
                // toDate: {
                //   gte: today,
                //   lt: next,
                // },
              },
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
                name: true,
                contact: true,
                fromDate: true,
                leaveAtGate: true,
                toDate: true,
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
                createdAt: true,
              },
            }),

            // service get
            this.prisma.serviceUser.findMany({
              where: {
                flatId: user.currentState.flatId,
                status: 'pending',
                type: 'preapproved',
                // fromDate: {
                //   gte: today,
                //   lt: next,
                // },
                // toDate: {
                //   gte: today,
                //   lt: next,
                // },
              },
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
                name: true,
                contact: true,
                fromDate: true,
                toDate: true,
                serviceType: {
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
                createdAt: true,
              },
            }),

            //guestmass get
            this.prisma.guestMass.findMany({
              where: {
                flatId: user.currentState.flatId,
                // fromDate: {
                //   gte: today,
                //   lt: next,
                // },
                // toDate: {
                //   gte: today,
                //   lt: next,
                // },
              },
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
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
                startDate: true,
                endDate: true,
                total: true,
                gatePass: {
                  select: {
                    code: true,
                  },
                },
                createdAt: true,
              },
            }),
          ]);

        let upcomings: {
          id: string;
          type: string;
          name: string | null;
          contact: string | null;
          fromDate: Date | null;
          toDate: Date | null;
          gatePass: {
            code: string;
          } | null;
          isOneDay: boolean | null;
          createdBy: {
            name: string | null;
            image: {
              url: string | null;
            } | null;
          } | null;
          serviceProvider: {
            name: string | null;
            image: {
              url: string | null;
            } | null;
          } | null;
          invited: number | null;
          leaveAtGate: boolean | null;
          createdAt: Date;
        }[] = [];

        guests.map((i) => {
          upcomings.push({
            ...i,
            type: 'guest',
            fromDate: i.startDate,
            toDate: i.endDate,
            serviceProvider: null,
            invited: null,
            leaveAtGate: null,
          });
        });

        rides.map((i) => {
          const { riderName, ...rest } = i;
          upcomings.push({
            ...rest,
            type: 'ride share',
            isOneDay: null,
            gatePass: null,
            name: riderName,
            invited: null,
            leaveAtGate: null,
          });
        });

        deliveries.map((i) => {
          upcomings.push({
            ...i,
            type: 'delivery',
            isOneDay: null,
            gatePass: null,
            name: i.name,
            invited: null,
          });
        });

        services.map((i) => {
          const { serviceType, ...rest } = i;
          upcomings.push({
            ...rest,
            type: 'Service',
            isOneDay: null,
            gatePass: null,
            serviceProvider: serviceType,
            invited: null,
            leaveAtGate: null,
          });
        });

        guestMasses.map((i) => {
          upcomings.push({
            id: i.id,
            type: 'guestmass',
            name: null,
            contact: null,
            fromDate: i.startDate,
            toDate: i.endDate,
            isOneDay: null,
            gatePass: i.gatePass ? { code: i.gatePass.code } : null,
            createdBy: i.createdBy,
            serviceProvider: null,
            invited: i.total,
            createdAt: i.createdAt,
            leaveAtGate: null,
          });
        });

        return upcomings.sort((a, b) => +b.createdAt - +a.createdAt);
      }

      case 'parcel': {
        const parcels = await this.prisma.delivery.findMany({
          where: {
            flats: {
              some: {
                id: user.currentState.flatId,
              },
            },
            leaveAtGate: true,
            checkInOuts: {
              some: {
                type: 'checkin',
                requests: {
                  some: {
                    hasUserConfirmed: false,
                    hasGuardCheckedIn: true,
                    type: 'parcel',
                    flatId: user.flatId,
                  },
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            contact: true,
            images: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        });

        const extended = await Promise.all(
          parcels.map(async (parcel) => {
            const parcelRequest = await this.prisma.checkInOutRequest.findFirst(
              {
                where: {
                  checkInOut: {
                    deliveryId: parcel.id,
                  },
                },
                select: {
                  id: true,
                  checkInOut: {
                    select: {
                      image: true,
                      vehicleNo: true,
                      vehicleType: true,
                      surveillance: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                  parcelHistory: {
                    select: {
                      status: true,
                      createdAt: true,
                    },
                    take: 1,
                    orderBy: {
                      createdAt: 'desc',
                    },
                  },
                  approvedByGuard: {
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
            );

            return {
              ...parcel,
              request: parcelRequest,
            };
          }),
        );

        return extended.filter((i) => i);
      }

      case 'past': {
        const logStart = extend?.start;
        const logEnd = extend?.end;

        const lastLog = await this.prisma.checkInOut.findFirst({
          where: {
            apartmentId: user.apartmentId,
            requestType: {
              in: ['guest', 'delivery', 'ride', 'service'],
            },
            type: 'checkout',
            //   {
            //     guest: {
            //       checkInOuts: {
            //         some: {
            //           type: 'checkout',
            //         },
            //       },
            //     },
            //   },
            //   {
            //     delivery: {
            //       checkInOuts: {
            //         some: {
            //           type: 'checkout',
            //         },
            //       },
            //     },
            //   },
            //   {
            //     ride: {
            //       checkInOuts: {
            //         some: {
            //           type: 'checkout',
            //         },
            //       },
            //     },
            //   },
            //   {
            //     service: {
            //       checkInOuts: {
            //         some: {
            //           type: 'checkout',
            //         },
            //       },
            //     },
            //   },
            // ],
            flats: {
              some: {
                id: user.currentState.flatId,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const firstLog = await this.prisma.checkInOut.findFirst({
          where: {
            apartmentId: user.apartmentId,
            requestType: {
              in: ['guest', 'delivery', 'ride', 'service'],
            },
            type: 'checkout',
            flats: {
              some: {
                id: user.currentState.flatId,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (!lastLog || !firstLog) return { docs: null, data: [] };

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

        const visitors = await this.prisma.checkInOut.getAllPaginated(
          {
            page,
            limit,
          },
          {
            where: {
              apartmentId: user.apartmentId,
              requestType: {
                in: ['guest', 'delivery', 'ride', 'service'],
              },
              type: 'checkout',
              flats: {
                some: {
                  id: user.currentState.flatId,
                },
              },
              createdAt: {
                gte: start,
                lte: end,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            distinct: ['guestId', 'deliveryId', 'rideId', 'serviceId'],
            select: {
              id: true,
              type: true,
              requestType: true,
              vehicleNo: true,
              vehicleType: true,
              image: true,
              guestId: true,
              rideId: true,
              deliveryId: true,
              serviceId: true,
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
                  startDate: true,
                  endDate: true,
                  createdBy: {
                    select: {
                      name: true,
                      image: {
                        select: {
                          url: true,
                        },
                      },
                      contact: true,
                    },
                  },
                },
              },
              ride: {
                select: {
                  riderName: true,
                  type: true,
                  contact: true,
                  fromDate: true,
                  toDate: true,
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
                      contact: true,
                    },
                  },
                },
              },
              delivery: {
                select: {
                  name: true,
                  type: true,
                  contact: true,
                  fromDate: true,
                  toDate: true,
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
                      contact: true,
                    },
                  },
                },
              },
              service: {
                select: {
                  name: true,
                  type: true,
                  contact: true,
                  fromDate: true,
                  toDate: true,
                  serviceType: {
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
                      contact: true,
                    },
                  },
                },
              },
              createdAt: true,
              updatedAt: true,
            },
          },
        );

        const logs = await Promise.all(
          visitors.data.map(async (item) => {
            const log = await this.prisma.checkInOut.findFirst({
              where: {
                type: 'checkin',
                createdAt: {
                  lt: item.createdAt,
                },
                guestId: item.guestId,
                serviceId: item.serviceId,
                deliveryId: item.deliveryId,
                rideId: item.rideId,
              },
              orderBy: {
                createdAt: 'desc',
              },
              include: {
                requests: {
                  where: {
                    status: 'approved',
                  },
                  select: {
                    approvedByUser: {
                      select: {
                        name: true,
                        image: {
                          select: {
                            url: true,
                          },
                        },
                        contact: true,
                      },
                    },
                    updatedAt: true,
                  },
                  take: 1,
                },
              },
            });

            if (!log) return undefined;

            let main: {
              serviceProvider: {
                image: {
                  url: string;
                } | null;
                name: string;
              } | null;
              type: $Enums.CheckTypeEnum;
              name: string | null;
              createdBy: {
                image: {
                  url: string;
                } | null;
                name: string | null;
                contact: string;
              } | null;
              contact: string | null;
              fromDate: Date | null;
              toDate: Date | null;
            } | null;

            if (item.requestType === 'guest' && item.guest) {
              main = {
                name: item.guest.name,
                serviceProvider: null,
                fromDate: item.guest?.startDate ? item.guest?.startDate : null,
                toDate: item.guest?.endDate ? item.guest?.endDate : null,
                contact: item.guest.contact,
                type: item.guest.type,
                createdBy: item.guest.createdBy,
              };
            } else if (item.requestType === 'ride' && item.ride) {
              main = {
                name: item.ride.riderName,
                serviceProvider: item.ride.serviceProvider,
                fromDate: item.ride.fromDate,
                toDate: item.ride.toDate,
                contact: item.ride.contact,
                type: item.ride.type,
                createdBy: item.ride.createdBy,
              };
            } else if (item.requestType === 'delivery' && item.delivery) {
              main = {
                name: item.delivery.name,
                serviceProvider: item.delivery.serviceProvider,
                fromDate: item.delivery.fromDate,
                toDate: item.delivery.toDate,
                contact: item.delivery.contact,
                type: item.delivery.type,
                createdBy: item.delivery.createdBy,
              };
            } else if (item.requestType === 'service' && item.service) {
              main = {
                name: item.service.name,
                serviceProvider: item.service.serviceType,
                fromDate: item.service.fromDate,
                toDate: item.service.toDate,
                contact: item.service.contact,
                type: item.service.type,
                createdBy: item.service.createdBy,
              };
            } else {
              main = null;
            }

            return {
              ...item,
              guestId: undefined,
              serviceId: undefined,
              deliveryId: undefined,
              rideId: undefined,
              guest: undefined,
              ride: undefined,
              delivery: undefined,
              service: undefined,
              deniedBy: null,
              deniedAt: null,
              main: {
                ...main,
                createdBy: main?.createdBy
                  ? main.createdBy
                  : log.requests.length > 0
                    ? log.requests[0]?.approvedByUser
                    : null,
              },
              enteredAt: log.requests[0]?.updatedAt || log.updatedAt,
              exitedAt: item.createdAt,
            };
          }),
        );

        return { docs: visitors.docs, data: logs.filter((i) => i) };
      }

      case 'rejected': {
        const logStart = extend?.start;
        const logEnd = extend?.end;

        const lastLog = await this.prisma.checkInOut.findFirst({
          where: {
            apartmentId: user.apartmentId,
            requestType: {
              in: ['guest', 'delivery', 'ride', 'service'],
            },
            type: 'checkin',
            requests: {
              every: {
                flatId: user.flatId,
                status: 'rejected',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const firstLog = await this.prisma.checkInOut.findFirst({
          where: {
            apartmentId: user.apartmentId,
            requestType: {
              in: ['guest', 'delivery', 'ride', 'service'],
            },
            type: 'checkin',

            requests: {
              some: {
                flatId: user.flatId,
                status: 'rejected',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (!lastLog || !firstLog) return { docs: null, data: [] };

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

        const logs = await this.prisma.checkInOut.getAllPaginatedById(
          { apartmentId: user.apartmentId, page, limit },
          {
            where: {
              type: 'checkin',
              createdAt: {
                gte: start,
                lte: end,
              },
              requests: {
                every: {
                  flatId: user.flatId,
                  status: 'rejected',
                },
              },
            },
            select: {
              id: true,
              type: true,
              requestType: true,
              vehicleNo: true,
              vehicleType: true,
              image: true,
              guest: {
                select: {
                  name: true,
                  type: true,
                  contact: true,
                  startDate: true,
                  endDate: true,
                  createdBy: {
                    select: {
                      name: true,
                      image: {
                        select: {
                          url: true,
                        },
                      },
                      contact: true,
                    },
                  },
                },
              },
              ride: {
                select: {
                  riderName: true,
                  type: true,
                  contact: true,
                  fromDate: true,
                  toDate: true,
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
                      contact: true,
                    },
                  },
                },
              },
              delivery: {
                select: {
                  name: true,
                  type: true,
                  contact: true,
                  fromDate: true,
                  toDate: true,
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
                      contact: true,
                    },
                  },
                },
              },
              service: {
                select: {
                  name: true,
                  type: true,
                  contact: true,
                  fromDate: true,
                  toDate: true,
                  serviceType: {
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
                      contact: true,
                    },
                  },
                },
              },
              createdByGuard: {
                select: {
                  name: true,
                  contact: true,
                },
              },
              createdByUser: {
                select: {
                  name: true,
                  contact: true,
                },
              },
              requests: {
                where: {
                  flatId: user.flatId,
                  status: 'rejected',
                },
                select: {
                  createdAt: true,
                  updatedAt: true,
                  requestRejected: {
                    select: {
                      name: true,
                      image: {
                        select: {
                          url: true,
                        },
                      },
                      contact: true,
                    },
                  },
                  rejectedByGuard: {
                    select: {
                      name: true,
                      image: {
                        select: {
                          url: true,
                        },
                      },
                      contact: true,
                    },
                  },
                },
              },
              createdAt: true,
              updatedAt: true,
              createdByType: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        );

        return {
          docs: logs.docs,
          data: logs.data
            .map((item) => {
              if (item.requests.length === 0) return;
              return {
                ...item,
                guestId: undefined,
                serviceId: undefined,
                deliveryId: undefined,
                rideId: undefined,
                guest: undefined,
                ride: undefined,
                delivery: undefined,
                service: undefined,
                requests: undefined,
                deniedBy: item.requests[0].requestRejected
                  ? item.requests[0].requestRejected
                  : item.requests[0].rejectedByGuard,
                deniedAt: item.requests[0].updatedAt,
                enteredAt: null,
                exitedAt: null,
                main:
                  item.requestType === 'guest'
                    ? {
                        ...item.guest,
                        fromDate: item.guest?.startDate
                          ? item.guest.startDate
                          : null,
                        toDate: item.guest?.endDate ? item.guest.endDate : null,
                        startDate: undefined,
                        endDate: undefined,
                        serviceProvider: null,
                      }
                    : item.requestType === 'ride'
                      ? {
                          ...item.ride,
                          name: item.ride?.riderName,
                          riderName: undefined,
                        }
                      : item.requestType === 'delivery'
                        ? item.delivery
                        : {
                            ...item.service,
                            serviceProvider: item.service?.serviceType,
                            serviceType: undefined,
                          },
              };
            })
            .filter((i) => i),
        };
      }

      default: {
        return { docs: null, data: [] };
      }
    }
  }
}
