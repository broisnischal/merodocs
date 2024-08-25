import { Get, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from '../../common/interface';

@Injectable()
export class ResidentialStaffService {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAll(
    data: GetAllParams<{
      floors?: string[];
      flats?: string[];
      blocks?: string[];
      sortBy?: 'asc' | 'desc';
    }>,
  ) {
    const { apartmentId, limit, page, q } = data;

    const staffsData = await this.prisma.clientStaff.getAllPaginatedById(
      {
        page,
        limit,
        apartmentId,
      },
      {
        where: {
          status: 'approved',
          approvedByAdmin: true,
          name: {
            contains: q,
            mode: 'insensitive',
          },
          flats: {
            some: {
              id: {
                in:
                  data.extended?.flats && data.extended?.flats?.length > 0
                    ? data.extended.flats
                    : undefined,
              },
              floor: {
                id: {
                  in:
                    data.extended?.floors && data.extended?.floors?.length > 0
                      ? data.extended.floors
                      : undefined,
                },
                block: {
                  id: {
                    in:
                      data.extended?.blocks && data.extended?.blocks?.length > 0
                        ? data.extended.blocks
                        : undefined,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: data.extended?.sortBy ? data.extended.sortBy : undefined,
          createdAt: data.extended?.sortBy ? undefined : 'desc',
        },
        select: {
          id: true,
          name: true,
          dob: true,
          contact: true,
          age: true,
          gender: true,
          createdByType: true,
          createdBy: {
            select: {
              id: true,
              contact: true,
              name: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          },
          createdAt: true,
          approvedAt: true,
          personalStaffRole: {
            select: {
              name: true,
            },
          },
          image: {
            select: {
              url: true,
            },
          },
          checkInOuts: {
            select: {
              type: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          clientStaffLogs: {
            select: {
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
              clientUserType: true,
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
          },
        },
      },
    );

    const updated = staffsData.data.map((staff) => {
      return {
        ...staff,
        checkInOuts: undefined,
        status:
          staff.checkInOuts[0]?.type === 'checkin'
            ? 'Currently inside the society'
            : 'Currently outside the society',
      };
    });

    return {
      data: updated,
      docs: staffsData.docs,
    };
  }

  async getSingle(data: GetParam) {
    const { id, apartmentId } = data;

    const staff = await this.prisma.clientStaff.findUnique({
      where: { id, apartmentId, approvedByAdmin: true },
      select: {
        id: true,
        name: true,
        dob: true,
        bloodgroup: true,
        contact: true,
        image: {
          select: {
            url: true,
          },
        },
        createdAt: true,
        approvedAt: true,
        emergency_contact: true,
        age: true,
        createdBy: {
          select: {
            id: true,
            contact: true,
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        createdByType: true,
        personalStaffRole: {
          select: {
            name: true,
          },
        },
        clientStaffLogs: {
          select: {
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
            clientUserType: true,
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
            updatedAt: true,
          },
        },
        flats: {
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
        checkInOuts: {
          select: {
            type: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        citizenshipFront: true,
        citizenshipBack: true,
        citizenshipNo: true,
        approvedBy: {
          select: {
            name: true,
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
    });

    if (!staff) throw new NotFoundException('Staff not found');

    return {
      ...staff,
      checkInOuts: undefined,
      status:
        staff.checkInOuts[0]?.type === 'checkin'
          ? 'Currently inside the society'
          : 'Currently outside the society',
    };
  }
}
