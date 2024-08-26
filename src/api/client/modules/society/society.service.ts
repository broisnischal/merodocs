import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams } from '../../common/interfaces';
import moment from 'moment';

@Injectable()
export class SocietyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSociety(data: GetAllParams) {
    const { q } = data;

    const apartment = await this.prisma.apartment.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
    });

    return apartment;
  }

  async getBlock(data: GetAllParams) {
    const { apartmentId } = data;

    const valid = await this.prisma.apartment.findFirst({
      where: { id: apartmentId },
    });

    if (!valid) throw new NotFoundException('Apartment doesnot exist');

    const blocks = await this.prisma.block.findMany({
      where: { archive: false, apartmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });

    return blocks;
  }

  async getFlat(data: GetAllParams) {
    const { withId, q } = data;

    const valid = await this.prisma.block.findFirst({
      where: { id: withId },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const floors = await this.prisma.floor.findMany({
      where: { archive: false, blockId: withId },
      orderBy: { createdAt: 'desc' },
      select: {
        flats: {
          where: {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const flats = floors.flatMap((data) => data.flats);

    return flats;
  }

  async getGuard(data: GetAllParams) {
    const { apartmentId, filter } = data;

    if (filter === 'online') {
      const today = moment().format('YYYY-MM-DD');

      const guards = await this.prisma.guardAttendance.findMany({
        where: {
          date: today,
          apartmentId,
          events: {
            some: {
              clockedIn: true,
              NOT: {
                clockedOut: true,
              },
            },
          },
          user: {
            archive: false,
            apartmentId,
          },
        },
        select: {
          user: {
            select: {
              id: true,
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
      });

      return guards.map((guard) => ({ ...guard.user }));
    } else if (filter === 'all') {
      const guards = await this.prisma.guardUser.findMany({
        where: { archive: false, apartmentId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          image: {
            select: {
              url: true,
            },
          },
          contact: true,
        },
      });

      return guards;
    } else {
      throw new BadRequestException('Filter doesnot exist');
    }
  }

  async getBanner(data: GetAllParams) {
    const { apartmentId } = data;

    const apartment = await this.prisma.clientPopUpBanner.findFirst({
      where: {
        apartmentId,
        activated: true,
        enabled: true,
      },
      select: {
        id: true,
        link: true,
        mobImage: true,
      },
    });

    return apartment;
  }

  async getBackground() {
    const images = await this.prisma.background.findMany({
      select: {
        image: true,
      },
    });

    return images;
  }
}
