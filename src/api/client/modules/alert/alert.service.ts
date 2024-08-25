import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AssignedUserParam } from '../../common/interfaces';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GuardNotificationService } from 'src/global/notification/guard-notification.service';

@Injectable()
@WebSocketGateway({ cors: true })
export class AlertService {
  @WebSocketServer()
  server?: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: GuardNotificationService,
  ) {}

  async create({ user, body }: AssignedUserParam.Create<CreateAlertDto>) {
    const flatData = await this.prisma.flat.findFirst({
      where: { id: user.flatId },
      select: {
        id: true,
        name: true,
        floor: { select: { name: true, block: { select: { name: true } } } },
      },
    });

    const image = await this.prisma.clientUser.findFirst({
      where: { id: user.id },
      select: { image: { select: { url: true } } },
    });

    const alert = await this.prisma.emergencyAlert.create({
      data: {
        type: body.type,
        flatId: user.flatId,
        apartmentId: user.apartmentId,
        createdById: user.id,
        history: {
          client: user.name,
          type: user.currentState.type,
          contact: user.contact,
          block: flatData?.floor.block.name,
          flat: flatData?.name,
          floor: flatData?.floor.name,
          image: image?.image?.url,
        },
      },
      select: {
        id: true,
        type: true,
        history: true,
      },
    });

    if (this.server) {
      const apartmentId = user.apartmentId;
      if (apartmentId) {
        this.server.to(apartmentId).emit('emergencyAlertCreated', alert);
      } else {
        console.error('Apartment ID is undefined.');
      }
    } else {
      console.error('WebSocket server is not defined.');
    }

    const guards = await this.prisma.guardUser.findMany({
      where: { apartmentId: user.apartmentId },
      select: {
        id: true,
        devices: {
          select: {
            fcmToken: true,
          },
        },
      },
    });

    const tokens: string[] = guards.flatMap((guard) =>
      guard.devices.map((d) => d.fcmToken),
    );

    await this.notification.create(
      {
        type: 'sos',
        name: user.name,
        block: flatData?.floor.block.name,
        flat: flatData?.name,
        sosType: body.type,
        path: `/sosAlertRoute/${alert.id}`,
        id: alert.id,
        live: 'yes',
        sound: 'yes',
      },
      tokens,
      guards.map((g) => g.id),
    );

    return alert;
  }

  async getAlert(data: AssignedUserParam.Get) {
    const { user, id } = data;

    const alert = await this.prisma.emergencyAlert.findFirst({
      where: { apartmentId: user.apartmentId, id },
      select: {
        id: true,
        respondedBy: {
          select: { name: true },
        },
        respondedAt: true,
      },
    });
    if (!alert) throw new NotFoundException('Alert doesnot exist');
    return alert;
  }
}
