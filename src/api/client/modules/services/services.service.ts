import {
  // BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateServiceUserDto } from './dto/service.dto';
import { AssignedUserParam } from '../../common/interfaces';
import { createServiceTypeDto } from './dto';
import { GuardNotificationService } from 'src/global/notification/guard-notification.service';

@Injectable()
export class SUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: GuardNotificationService,
  ) {}

  async create({ body, user }: AssignedUserParam.Create<CreateServiceUserDto>) {
    const { always, contact, fromDate, name, serviceTypeId, toDate } = body;
    // if (!fromDate || !toDate || fromDate >= toDate) {
    //   throw new BadRequestException('Invalid start date or end date');
    // }

    // const currentDate = new Date();
    // const startDateObj = new Date(fromDate);
    // const endDateObj = new Date(toDate);

    // if (startDateObj <= currentDate || endDateObj <= currentDate) {
    //   throw new BadRequestException(
    //     'Start date or end date cannot be in the past',
    //   );
    // }

    const validServiceId = await this.prisma.serviceType.findUnique({
      where: {
        id: serviceTypeId,
        OR: [{ forAll: true }, { userId: user.id }],
      },
    });

    if (!validServiceId) {
      throw new NotFoundException('Service Type not found');
    }

    const response = await this.prisma.serviceUser.create({
      data: {
        contact,
        fromDate,
        toDate,
        name,
        flatId: user.flatId,
        serviceTypeId,
        always,
        status: 'pending',
        type: 'preapproved',
        createdById: user.id,
        createdByType: user.currentState.type,
      },
      include: {
        flat: {
          select: {
            name: true,
            floor: { select: { block: { select: { name: true } } } },
            apartment: { select: { id: true } },
          },
        },
        createdBy: { select: { name: true } },
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
        type: 'service',
        name: user.name || '',
        block: response.flat.floor.block.name,
        flat: response.flat.name,
        id: response.id,
        provider: name,
        providerType: validServiceId.name,
        path: `/preApprovedServicesDetails/${response.id}`,
      },
      tokens,
      guards.map((g) => g.id),
    );

    return response;
  }

  async delete({ id, user }: AssignedUserParam.Delete) {
    const exists = await this.prisma.serviceUser.findUnique({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!exists) {
      throw new NotFoundException('Service incoming does not exists');
    }

    const deleted = await this.prisma.serviceUser.delete({
      where: {
        id,
      },
    });

    return deleted;
  }

  async getSingle({ id, user }: AssignedUserParam.Get) {
    const service = await this.prisma.serviceUser.findUnique({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!service) throw new NotFoundException('Service user doesnot exists');

    return service;
  }

  async getAll({ user }: AssignedUserParam.GetAll) {
    const services = await this.prisma.serviceUser.findMany({
      where: {
        flatId: user.flatId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return services;
  }

  async getAllServiceProviders({ user }: AssignedUserParam.GetAll) {
    const serviceProviders = await this.prisma.serviceType.findMany({
      where: {
        OR: [{ forAll: true }, { userId: user.id }],
      },
      include: {
        image: { select: { url: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return serviceProviders;
  }

  async createServiceType({
    user,
    body,
  }: AssignedUserParam.Create<createServiceTypeDto>) {
    const { name } = body;

    const unique = await this.prisma.serviceType.findFirst({
      where: { name, userId: user.id },
    });

    if (unique) throw new ConflictException('Name already exist');

    const service = await this.prisma.serviceType.create({
      data: {
        name,
        userId: user.id,
      },
    });

    return service;
  }
}
