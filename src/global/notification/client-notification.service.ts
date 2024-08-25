import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClientNotificationEnum,
  ClientNotificationLogoEnum,
} from '@prisma/client';
import { ClientFirebaseService } from '../firebase/client-firebase.service';
import { generateLogo } from 'src/common/utils/static-logo.util';

interface NotificationProps {
  title: string;
  body: string;
  clientUserId: string;
  type: ClientNotificationEnum;
  path?: string;
  clickable?: boolean;
  logo?: ClientNotificationLogoEnum;
  live?: string;
  id: string;
  overlay?: string;
  popup?: string;
  flatId?: string;
  sound?: string;
}

type MultipleNotificationsProps = Omit<NotificationProps, 'clientUserId'>;

@Injectable()
export class ClientNotificationService {
  private readonly logger = new Logger(ClientNotificationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: ClientFirebaseService,
  ) {}

  async getAll(data: { page: number; limit: number; clientId: string }) {
    const [res, read, unread] = await Promise.all([
      this.prisma.clientNotification.getAllPaginated(
        {
          page: data.page,
          limit: data.limit,
        },
        {
          where: {
            clientUserId: data.clientId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      ),
      this.prisma.clientNotification.count({
        where: {
          clientUserId: data.clientId,
          isRead: true,
        },
      }),
      this.prisma.clientNotification.count({
        where: {
          clientUserId: data.clientId,
          isRead: false,
        },
      }),
    ]);

    return {
      ...res,
      data: res.data.map((i: any) => ({
        ...i,
        logo: i?.logo ? generateLogo(i.logo) : '',
      })),
      read,
      unread,
    };
  }

  async createRequestNotification(props: NotificationProps) {
    const user = await this.prisma.clientUser.findUnique({
      where: {
        id: props.clientUserId,
      },
      select: {
        devices: true,
      },
    });

    if (user) {
      if (user.devices.length > 0) {
        const tokens = user.devices
          .map((i) => i.fcmToken)
          .filter((token) => token);

        if (tokens.length > 0)
          await this.firebase.sendMultiplePushNotificationClient(tokens, {
            data: {
              id: props.clientUserId,
              path: props.path,
              flatId: props.flatId ? props.flatId : '',
            },
            notification: {
              body: props.body,
              title: props.title,
              image: '',
            },
          });
      }

      return await this.prisma.clientNotification.create({
        data: {
          type: props.type,
          title: props.title,
          body: props.body,
          clientUserId: props.clientUserId,
          path: props.path,
          logo: props.logo,
          flatId: props.flatId,
        },
      });
    }
  }

  async createNotification(
    props: NotificationProps,
    tokens: string[],
    flag: boolean = true,
  ) {
    try {
      if (tokens.length > 0)
        await this.firebase.sendMultiplePushNotificationClient(tokens, {
          data: {
            id: props.clientUserId,
            path: props.path,
            live: props.live ? props.live : 'no',
            overlay: props.overlay ? props.overlay : 'no',
            popup: props.popup ? props.popup : 'no',
            flatId: props.flatId,
          },
          notification: {
            body: props.body,
            title: props.title,
            image: props.logo ? generateLogo(props.logo) : '',
          },
        });

      if (flag) {
        return await this.prisma.clientNotification.create({
          data: {
            type: props.type,
            title: props.title,
            body: props.body,
            clientUserId: props.clientUserId,
            path: props.path,
            clickable: props.clickable,
            logo: props.logo,
            id: props.id,
            flatId: props.flatId,
          },
        });
      }
    } catch (err) {
      this.logger.warn(err);
    }
  }

  async createMultipleNotification(
    props: MultipleNotificationsProps & { id: string },
    tokens: string[],
    ids: string[],
    flag: boolean = true,
  ) {
    try {
      if (tokens.length > 0) {
        await this.firebase.sendMultiplePushNotificationClient(tokens, {
          data: {
            id: props.id,
            path: props.path,
            live: props.live ? props.live : 'no',
            overlay: props.overlay ? props.overlay : 'no',
            popup: props.popup ? props.popup : 'no',
            flatId: props.flatId,
            sound: props.sound ? props.sound : 'no',
          },
          notification: {
            body: props.body,
            title: props.title,
            image: props.logo ? generateLogo(props.logo) : '',
          },
        });
      }

      if (flag) {
        return await this.prisma.clientNotification.createMany({
          data: ids.map((id) => ({
            type: props.type,
            title: props.title,
            body: props.body,
            clientUserId: id,
            path: props.path,
            clickable: props.clickable,
            logo: props.logo,
            flatId: props.flatId,
          })),
        });
      }
    } catch (err) {
      this.logger.warn(err);
    }
  }

  async markAsRead(id: string, clientId: string) {
    const exist = await this.prisma.clientNotification.findFirst({
      where: {
        id,
        clientUserId: clientId,
      },
    });

    if (!exist) return;

    await this.prisma.clientNotification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }
}
