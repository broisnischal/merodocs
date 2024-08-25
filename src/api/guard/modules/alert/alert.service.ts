import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetAllParams, UpdateParams } from '../../common/interface';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';

@Injectable()
export class AlertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async getAlert(data: GetAllParams) {
    const { apartmentId, id } = data;

    const alert = await this.prisma.emergencyAlert.findFirst({
      where: { apartmentId, id },
      select: {
        id: true,
        type: true,
        history: true,
        createdBy: {
          select: { image: { select: { url: true } } },
        },
      },
    });
    if (!alert) throw new NotFoundException('Alert doesnot exist');
    return alert;
  }

  async respond(data: UpdateParams<undefined>) {
    const { apartmentId, id, loggedUserData } = data;

    const alert = await this.prisma.emergencyAlert.findFirst({
      where: { apartmentId, id },
      include: {
        apartment: { select: { name: true } },
        createdBy: {
          select: { id: true, devices: { select: { fcmToken: true } } },
        },
        flat: {
          select: {
            name: true,
            floor: { select: { block: { select: { name: true } } } },
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('Alert doesnot exist');
    }

    if (alert.respondedById)
      throw new BadRequestException('Alert already responded');

    const surveillanceId = loggedUserData.defaultSurveillanceId;

    if (!surveillanceId)
      throw new BadRequestException('Default surveillance ID is missing.');

    const surveillance = await this.prisma.surveillance.findUnique({
      where: { id: surveillanceId },
      select: { name: true },
    });

    const respond = await this.prisma.emergencyAlert.update({
      where: { id },
      data: {
        respondedAt: new Date(),
        respondedById: loggedUserData.id,
        surveillance: surveillance?.name,
      },
    });

    const tokens: string[] = alert.createdBy.devices
      .map((device) => device.fcmToken)
      .filter((token) => token);

    await this.clientNotification.createMultipleNotification(
      {
        type: 'sos',
        title: `SOS Alert Responded | ${alert.flat.floor.block.name}-${alert.flat.name},${alert.apartment.name}`,
        body: `${loggedUserData.name} from ${surveillance?.name} has responded to your alert and will reach out to you shortly`,
        clickable: false,
        logo: 'sos',
        path: ClientAppRouter.DEFAULT,
        id: alert.id,
        popup: 'yes',
        flatId: alert.flatId,
      },
      tokens,
      [alert.createdBy.id],
    );

    return respond;
  }

  async getAlertHistory(data: GetAllParams) {
    const { apartmentId, extended } = data;

    const page = Number(data.page) || 1;
    const limit = Number(data.limit) || 10;

    const historyDate = extended.historyDate
      ? new Date(extended.historyDate)
      : null;

    let whereCondition: any = {};

    if (historyDate) {
      whereCondition.createdAt = {
        gte: historyDate,
        lt: new Date(historyDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const logs = await this.prisma.emergencyAlert.getAllPaginatedById(
      { apartmentId, page, limit },
      {
        where: whereCondition,
        select: {
          id: true,
          type: true,
          history: true,
          respondedBy: {
            select: { name: true },
          },
          createdAt: true,
          respondedAt: true,
          surveillance: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    );

    return logs;
  }
}
