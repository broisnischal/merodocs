import { Injectable } from '@nestjs/common';
import { ClientUserType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type FlatJSON = {
  name: string;
  floor: {
    name: string;
    block: {
      name: string;
    };
  };
};

export type ParentJSON =
  | {
      type: ClientUserType | null;
      name: string | null;
      contact: string;
      image?: {
        url: string | null;
      } | null;
    }
  | object;

@Injectable()
export class CheckInOutLogService {
  constructor(private prisma: PrismaService) {}

  async findParentUser(flatId: string) {
    const owner = await this.prisma.clientUser.findFirst({
      where: {
        currentFlats: {
          some: {
            flatId,
            type: 'owner',
          },
        },
      },
      select: {
        name: true,
        contact: true,
        image: { select: { url: true } },
      },
    });

    let parentUser: {
      type: ClientUserType | null;
      name: string | null;
      contact: string;
      image?: {
        url: string | null;
      } | null;
    } | null = null;

    if (owner) {
      parentUser = {
        type: 'owner',
        name: owner.name,
        contact: owner.contact,
        image: owner.image,
      };
    }

    if (!parentUser) {
      const user = await this.prisma.clientUser.findFirst({
        where: {
          currentFlats: {
            some: {
              flatId,
              type: 'tenant',
            },
          },
        },
        select: {
          name: true,
          contact: true,
          image: { select: { url: true } },
        },
      });

      if (user) {
        parentUser = {
          type: 'tenant',
          name: user.name,
          contact: user.contact,
          image: user.image,
        };
      }
    }

    if (!parentUser) {
      const user = await this.prisma.clientUser.findFirst({
        where: {
          currentFlats: {
            some: {
              flatId,
              type: {
                in: ['owner_family', 'tenant_family'],
              },
            },
          },
        },
        select: {
          name: true,
          contact: true,
          image: { select: { url: true } },
          currentFlats: {
            where: {
              flatId,
            },
            select: {
              type: true,
            },
            take: 1,
          },
        },
      });

      if (user) {
        parentUser = {
          type: user.currentFlats[0].type,
          name: user.name,
          contact: user.contact,
          image: user.image,
        };
      }
    }

    return parentUser;
  }

  createFlatJson(flat: {
    name: string;
    floor: { name: string; block: { name: string } };
  }): FlatJSON {
    return flat;
  }

  createParentJSON(createdBy: ParentJSON | null = {}): ParentJSON {
    return createdBy ? createdBy : {};
  }
}
