import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAllParams, GetParam } from '../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { getPageDocs, pagination } from 'src/common/utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResidentService {
  constructor(private readonly prisma: PrismaService) {}

  async getResidentCurrent(
    data: GetAllParams<{
      floors?: string[];
      flats?: string[];
      blocks?: string[];
      sortBy?: 'asc' | 'desc';
    }>,
  ) {
    const { apartmentId, q, residentType } = data;

    const { page, limit, skip } = pagination({
      page: data.page,
      limit: data.limit,
    });

    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const whereCondition: Prisma.ClientUserWhereInput = {
      name: { contains: q ? q : undefined, mode: 'insensitive' },
      currentFlats: {
        some: {
          apartmentId,
          flat: {
            apartmentId,
            id:
              data.extended?.flats && data.extended?.flats?.length > 0
                ? {
                    in: data.extended.flats,
                  }
                : undefined,

            floor: {
              id:
                data.extended?.floors && data.extended?.floors?.length > 0
                  ? {
                      in: data.extended.floors,
                    }
                  : undefined,
              block: {
                id:
                  data.extended?.blocks && data.extended?.blocks?.length > 0
                    ? {
                        in: data.extended.blocks,
                      }
                    : undefined,
              },
            },
          },
          type:
            residentType === 'family'
              ? {
                  in: ['owner_family', 'tenant_family'],
                }
              : residentType,
        },
      },
    };

    const clients = await this.prisma.clientUser.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        email: true,
        age: true,
        gender: true,
        family: true,
        clientApartments: {
          where: {
            apartmentId,
            status: 'approved',
            requestType: {
              not: 'moveOut',
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          distinct: ['flatId'],
          select: {
            id: true,
            type: true,
            residing: true,
            offline: true,
            createdAt: true,
            updatedAt: true,
            flatId: true,
            verifiedBy: {
              select: {
                name: true,
                image: { select: { url: true } },
                offline: true,
              },
            },
            verifiedByType: true,
            flat: {
              select: {
                id: true,
                type: true,
                name: true,
                floor: {
                  select: {
                    name: true,
                    block: { select: { name: true } },
                  },
                },
              },
            },
            updatedBy: {
              select: {
                name: true,
                image: { select: { url: true } },
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: data.extended?.sortBy
        ? {
            name: {
              sort: data.extended.sortBy,
              nulls: 'last',
            },
          }
        : {
            createdAt: 'desc',
          },
      skip,
      take: limit,
    });

    const filtered = clients.map((item) => ({
      ...item,
      clientApartments: item.clientApartments.reduce((acc, curr) => {
        if (acc.find((i) => i.flatId === curr.flatId)) return acc;

        acc.push(curr);

        return acc;
      }, [] as any[]),
      adminUser:
        item.clientApartments.length > 0
          ? item.clientApartments.map((i) => i).reverse()[0].updatedBy
          : null,
    }));

    const count = await this.prisma.clientUser.count({
      where: whereCondition,
    });

    const docs = getPageDocs({
      page,
      limit,
      count,
    });

    return { docs, result: filtered };
  }

  async getResidentMovedOut(
    data: GetAllParams<{
      floors?: string[];
      flats?: string[];
      blocks?: string[];
      sortBy?: 'asc' | 'desc';
    }>,
  ) {
    const { apartmentId, q, residentType } = data;

    const { page, limit, skip } = pagination({
      page: data.page,
      limit: data.limit,
    });

    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    const whereCondition: Prisma.ClientUserWhereInput = {
      name: { contains: q ? q : undefined, mode: 'insensitive' },
      flats: {
        some: {
          apartmentId,
          id:
            data.extended?.flats && data.extended?.flats?.length > 0
              ? {
                  in: data.extended.flats,
                }
              : undefined,

          floor: {
            id:
              data.extended?.floors && data.extended?.floors?.length > 0
                ? {
                    in: data.extended.floors,
                  }
                : undefined,
            block: {
              id:
                data.extended?.blocks && data.extended?.blocks?.length > 0
                  ? {
                      in: data.extended.blocks,
                    }
                  : undefined,
            },
          },
        },
      },
      clientApartments: {
        some: {
          apartmentId,
          status: 'approved',
          requestType: {
            in: ['addAccount', 'moveIn'],
          },
          type:
            residentType === 'family'
              ? {
                  in: ['owner_family', 'tenant_family'],
                }
              : residentType,
        },
      },
      currentFlats: {
        none: {
          apartmentId,
        },
      },
    };

    const clients = await this.prisma.clientUser.findMany({
      where: whereCondition,
      orderBy: data.extended?.sortBy
        ? {
            name: {
              sort: data.extended.sortBy,
              nulls: 'last',
            },
          }
        : {
            createdAt: 'desc',
          },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        image: {
          select: {
            url: true,
          },
        },
        contact: true,
        email: true,
        gender: true,
        clientApartments: {
          where: {
            apartmentId,
            status: 'approved',
            requestType: 'moveOut',
          },
          distinct: ['flatId'],
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            type: true,
            createdAt: true,
            flatId: true,
            verifiedBy: {
              select: {
                name: true,
                image: { select: { url: true } },
              },
            },
            verifiedByType: true,
            flat: {
              select: {
                id: true,
                type: true,
                name: true,
                floor: {
                  select: {
                    name: true,
                    block: { select: { name: true } },
                  },
                },
              },
            },
            residing: true,
            updatedBy: {
              select: {
                name: true,
                image: { select: { url: true } },
                role: {
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

    const filtered = clients.map((item) => ({
      ...item,
      clientApartments: item.clientApartments.reduce((acc, curr) => {
        if (acc.find((i) => i.flatId === curr.flatId)) return acc;

        acc.push(curr);

        return acc;
      }, [] as any[]),
      adminUser:
        item.clientApartments.length > 0
          ? item.clientApartments.map((i) => i).reverse()[0].updatedBy
          : null,
    }));

    const count = await this.prisma.clientUser.count({
      where: whereCondition,
    });

    const docs = getPageDocs({
      page,
      limit,
      count,
    });

    return { docs, data: filtered };
  }

  async getResidentById(data: GetParam) {
    const { apartmentId, id } = data;

    const client = await this.prisma.clientUser.findUnique({
      where: {
        id,
        flats: {
          some: {
            apartmentId: apartmentId,
          },
        },
      },
      select: {
        name: true,
        image: {
          select: {
            url: true,
          },
        },
        contact: true,
        email: true,
        age: true,
        gender: true,
        currentFlats: {
          where: {
            apartmentId,
          },
          select: {
            id: true,
            flat: {
              select: {
                currentClients: {
                  where: {
                    type: {
                      in: ['owner_family', 'tenant_family'],
                    },
                  },
                  select: {
                    clientUser: {
                      select: {
                        name: true,
                        image: {
                          select: {
                            url: true,
                          },
                        },
                        age: true,
                        gender: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        flats: {
          where: {
            apartmentId,
          },
          select: {
            id: true,
            name: true,
            currentClients: {
              where: {
                type: {
                  in: ['owner', 'tenant'],
                },
              },
              include: {
                clientUser: {
                  select: {
                    name: true,
                    age: true,
                    gender: true,
                    image: { select: { url: true } },
                  },
                },
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
        clientApartments: {
          where: {
            apartmentId,
            status: 'approved',
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            updatedBy: {
              select: {
                name: true,
                image: { select: { url: true } },
                role: { select: { name: true } },
              },
            },
          },
        },
        pets: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            age: true,
            gender: true,
            typee: true,
            breed: true,
          },
        },
        vehicles: {
          select: {
            image: {
              select: {
                url: true,
              },
            },
            name: true,
            type: true,
          },
        },
        // apartmentClientUserVerified: {
        //   where: {
        //     apartmentId,
        //     status: 'approved',
        //     type: {
        //       in: ['owner_family', 'tenant_family'],
        //     },
        //   },
        //   select: {
        //     clientUser: {
        //       select: {
        //         name: true,
        //         image: {
        //           select: {
        //             url: true,
        //           },
        //         },
        //         age: true,
        //         gender: true,
        //       },
        //     },
        //   },
        // },
      },
    });

    if (!client) throw new NotFoundException('Resident does not exist');

    const documents = await this.prisma.documentType.findMany({
      where: {
        archive: false,
        apartmentId,
      },
      select: {
        id: true,
        name: true,
        documentFileClient: {
          where: {
            uploadedForId: id,
          },
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      ...client,
      documents,
      currentFlats: undefined,
      status:
        client.currentFlats.length > 0 ? 'Currently Residing' : 'Moved-Out',
      members: client.currentFlats.reduce((acc, curr) => {
        curr.flat.currentClients.map((i) => {
          acc.push(i.clientUser);
        });

        return acc;
      }, [] as any[]),
      adminUser:
        client.clientApartments.length > 0
          ? client.clientApartments.map((i) => i).reverse()[0].updatedBy
          : null,
      flats: client.flats.map((i) => {
        let movedOut: boolean = false;
        const lastReq = client.clientApartments.find(
          (i) => i.flatId === i.flatId,
        );
        const firstReq = client.clientApartments.find(
          (i) =>
            i.flatId === i.flatId &&
            i.id !== lastReq?.id &&
            (i.requestType === 'moveIn' || i.requestType === 'addAccount'),
        );

        if (lastReq && lastReq.requestType === 'moveOut') {
          movedOut = true;
        }

        return {
          ...i,
          currentClients: undefined,
          type: lastReq?.type,
          initiatedDate: !movedOut ? lastReq?.moveIn : firstReq?.moveIn,
          movedOutDate: lastReq?.moveOut,
          owner: i.currentClients.find(
            (c) => c.type === 'owner' && c.clientUserId !== id,
          )?.clientUser,
          tenant: i.currentClients.find(
            (c) => c.type === 'tenant' && c.clientUserId !== id,
          )?.clientUser,
        };
      }),
    };
  }
}
