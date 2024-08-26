import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from '../../common/interface';
import moment from 'moment';
import { ServiceProviderTypeEnum } from '@prisma/client';

@Injectable()
export class DetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllFlats(data: GetAllParams) {
    const { q, apartmentId } = data;
    return await this.prisma.flat.findMany({
      where: {
        apartmentId,
        name: {
          contains: q?.toLowerCase(),
          mode: 'insensitive',
        },
        currentClients: {
          some: {},
        },
      },
    });
  }

  async getAllServices(data: GetAllParams) {
    const { q, apartmentId } = data;
    return await this.prisma.serviceType.findMany({
      where: {
        name: q && {
          contains: q,
          mode: 'insensitive',
        },
        OR: [{ forAll: true }, { apartmentId }],
      },
      include: {
        image: {
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllServiceProviders(
    data: GetAllParams<{ type?: ServiceProviderTypeEnum }>,
  ) {
    const { q, apartmentId } = data;
    return await this.prisma.serviceProvider.findMany({
      where: {
        name: {
          contains: q?.toLowerCase(),
          mode: 'insensitive',
        },
        OR: [{ forAll: true }, { apartmentId }],
        type: data.extended?.type ? data.extended.type : undefined,
      },
      include: {
        image: {
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPreapprovedCounts(data: GetAllParams) {
    const { apartmentId } = data;

    const [guest, delivery, rider, services, guestmass, parcelPending] =
      await Promise.all([
        this.prisma.guest.count({
          where: {
            flat: { apartmentId },
            status: 'pending',
            type: 'preapproved',
          },
        }),
        this.prisma.delivery.count({
          where: {
            flats: { some: { apartmentId } },
            status: 'pending',
            type: 'preapproved',
          },
        }),
        this.prisma.ride.count({
          where: {
            flat: { apartmentId },
            status: 'pending',
            type: 'preapproved',
          },
        }),
        this.prisma.serviceUser.count({
          where: {
            flat: { apartmentId },
            status: 'pending',
            type: 'preapproved',
          },
        }),
        this.prisma.guestMass.count({
          where: {
            flat: { apartmentId },
            startDate: {
              gte: new Date(),
            },
          },
        }),
        this.prisma.checkInOutRequest.count({
          where: {
            checkInOut: { apartmentId },
            type: 'parcel',
            isCollected: false,
          },
        }),
      ]);

    return { guest, delivery, rider, services, guestmass, parcelPending };
  }

  async getFlatMember(data: GetAllParams) {
    const { id, apartmentId } = data;
    const flat = await this.prisma.flatCurrentClient.findMany({
      where: { flatId: id, apartmentId },
      select: {
        type: true,
        clientUser: {
          select: {
            id: true,
            name: true,
            image: { select: { url: true } },
            contact: true,
          },
        },
      },
    });

    if (!flat) throw new NotFoundException('Flat doesnot exist');

    return flat.map((flatMember) => ({
      type: flatMember.type,
      ...flatMember.clientUser,
    }));
  }

  async getProfile(data: GetParam) {
    const { id } = data;

    const guard = await this.prisma.guardUser.findFirst({
      where: {
        id,
      },
      select: {
        image: { select: { url: true } },
        name: true,
        surveillance: { select: { name: true } },
        shift: { select: { name: true, start: true, end: true } },
        username: true,
        email: true,
        contact: true,
        bloodgroup: true,
        gender: true,
        dob: true,
        apartment: {
          select: {
            name: true,
          },
        },
        defaultSurveillance: true,
      },
    });

    const start = moment(guard?.shift.start)
      .utcOffset(0, false)
      .format('hh:mm A');
    const end = moment(guard?.shift.end).utcOffset(0, false).format('hh:mm A');

    const clockedIn = await this.prisma.guardClockedEvent.findFirst({
      where: {
        attendance: {
          userId: id,
        },
        clockedIn: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const unreadNotification = await this.prisma.guardNotification.count({
      where: {
        isRead: false,
        guardUserId: id,
      },
    });

    return {
      ...guard,
      surveillance: guard?.defaultSurveillance
        ? guard.defaultSurveillance
        : guard?.surveillance,
      defaultSurveillance: undefined,
      shift: {
        ...guard?.shift,
        start,
        end,
        clockedIn: clockedIn ? clockedIn.createdAt : '',
      },
      unreadNotification,
    };
  }

  async getSurveillance(data: GetAllParams) {
    const { apartmentId } = data;

    const surveillance = await this.prisma.surveillance.existMany(apartmentId, {
      where: {
        archive: false,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return surveillance;
  }
}
