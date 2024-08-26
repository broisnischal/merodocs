import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRideDto } from './dto/ride.dto';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';
import { createRideTypeDto } from './dto';
import { GuardNotificationService } from 'src/global/notification/guard-notification.service';

@Injectable()
export class RideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: GuardNotificationService,
  ) {}

  async getRides({ user }: AssignedUserParam.GetAll) {
    const rides = await this.prisma.ride.findMany({
      where: {
        flatId: user.flatId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return rides;
  }

  async inviteRide({ body, user }: AssignedUserParam.Create<CreateRideDto>) {
    const { providerId, ...rest } = body;
    const isRide = await this.prisma.serviceProvider.findUnique({
      where: {
        id: body.providerId,
        OR: [{ forAll: true }, { userId: user.id }],
      },
    });

    if (!isRide) {
      throw new NotFoundException('Provider not found');
    }

    if (isRide?.type !== 'ride') {
      throw new BadRequestException('Not a ride provider');
    }

    const value = await this.prisma.ride.create({
      data: {
        type: 'preapproved',
        ...rest,
        serviceProviderId: providerId,
        flatId: user.flatId,
        createdById: user.id,
        createdByType: user.currentState.type,
      },
      include: {
        createdBy: { select: { name: true } },
        flat: {
          select: {
            name: true,
            floor: { select: { block: { select: { name: true } } } },
          },
        },
      },
    });

    const guards = await this.prisma.guardUser.findMany({
      where: { apartmentId: user.apartmentId, archive: false },
      select: { id: true, devices: { select: { fcmToken: true } } },
    });

    const tokens: string[] = guards.flatMap((guard) =>
      guard.devices.map((d) => d.fcmToken),
    );

    await this.notification.create(
      {
        type: 'rider',
        name: user.name,
        block: value.flat.floor.block.name,
        flat: value.flat.name,
        path: `/preApprovedRiderDetails/${value.id}`,
        provider: value.riderName || 'Rider',
        providerType: isRide.name,
        id: value.id,
      },
      tokens,
      guards.map((g) => g.id),
    );

    return value;
  }

  async cancelRider({ id, user }: AssignedUserParam.Delete) {
    const isRide = await this.prisma.ride.findUnique({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!isRide) {
      throw new NotFoundException('Ride not found');
    }

    const deleteRide = await this.prisma.ride.delete({
      where: {
        id,
      },
    });

    return deleteRide;
  }

  async get({ user }: AssignedUserParam.GetAll) {
    const providers = await this.prisma.serviceProvider.findMany({
      where: {
        type: 'ride',
        OR: [{ forAll: true }, { userId: user.id }],
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

    return providers;
  }

  async createRideType({
    body,
    user,
  }: AssignedUserParam.Create<createRideTypeDto>) {
    const { name } = body;

    const unique = await this.prisma.serviceProvider.findFirst({
      where: { name, type: 'ride', userId: user.id },
    });

    if (unique) throw new ConflictException('Name already exist');

    const service = await this.prisma.serviceProvider.create({
      data: {
        name,
        type: 'ride',
        userId: user.id,
      },
    });

    return service;
  }
}
