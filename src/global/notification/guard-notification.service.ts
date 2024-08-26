import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmergencyAlertType, GuardNotificationEnum } from '@prisma/client';
import { GuardFirebaseService } from '../firebase/guard-firebase.service';
import { capitalize } from 'lodash';
import { generateLogo } from 'src/common/utils/static-logo.util';

interface NotificationProps {
  type: GuardNotificationEnum;
  name?: string;
  block?: string;
  flat?: string;
  providerType?: string;
  provider?: string;
  sosType?: EmergencyAlertType;
  path?: string;
  id: string;
  clickable?: boolean;
  live?: string;
  sound?: string;
}

@Injectable()
export class GuardNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: GuardFirebaseService,
  ) {}

  async create(props: NotificationProps, tokens: string[], ids: string[]) {
    let title: string;
    let body: string;

    switch (props.type) {
      case 'sos':
        title = `${props.sosType} Alert - by ${capitalize(props.name)} | Block ${capitalize(props.block)}-${capitalize(props?.flat)}`;
        body = `New Alert Reported. Tap to acknowledge.`;
        break;

      case 'delivery':
        title = `Delivery Preapproval - by ${capitalize(props.name)} | Block ${capitalize(props.block)}-${capitalize(props?.flat)}`;
        body = `has requested entry for delivery from ${capitalize(props.providerType)}.`;
        break;

      case 'guest':
        title = `Guest Preapproval - by ${capitalize(props.name)} | Block ${capitalize(props.block)}-${capitalize(props.flat)}`;
        body = `has requested entry for guest ${capitalize(props.provider)}.`;
        break;

      case 'parcel':
        title = `Parcel at Gate - by ${capitalize(props.name)} | Block ${capitalize(props.block)}-${capitalize(props?.flat)}`;
        body = `has requested to collect parcel from ${capitalize(props.providerType)}.`;
        break;

      case 'rider':
        title = `Rider Preapproval - by ${capitalize(props.name)} | Block ${capitalize(props.block)}-${capitalize(props.flat)}`;
        body = `has requested entry for rider ${capitalize(props.provider)} from ${capitalize(props.providerType)}.`;
        break;

      case 'service':
        title = `Service Preapproval - by ${capitalize(props.name)} | Block ${capitalize(props.block)}-${capitalize(props.flat)}`;
        body = `has requested entry for ${props.providerType} ${capitalize(props.provider)}.`;
        break;
    }

    await this.firebase.sendMultiplePushNotificationGuard(tokens, {
      data: {
        id: props.id,
        path: props.path,
        live: props.live ? props.live : 'no',
        sound: props.sound ? props.sound : 'no',
      },
      notification: {
        body,
        title,
        image:
          props.type === 'sos'
            ? process.env.CLOUDFRONT + 'static/sos.png'
            : process.env.CLOUDFRONT + 'static/approve.png',
      },
    });

    return await this.prisma.guardNotification.createMany({
      data: ids.map((id) => ({
        title,
        body,
        type: props.type,
        guardUserId: id,
        path: props.path!,
        redirectId: props.id,
      })),
    });
  }

  async getAll(data: { page: number; limit: number; guardId: string }) {
    const [res, unread] = await Promise.all([
      this.prisma.guardNotification.getAllPaginated(
        {
          page: data.page,
          limit: data.limit,
        },
        {
          where: {
            guardUserId: data.guardId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      ),

      this.prisma.guardNotification.count({
        where: {
          guardUserId: data.guardId,
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
      unread,
    };
  }

  async markAsRead(id: string, guardId: string) {
    const exist = await this.prisma.guardNotification.findFirst({
      where: {
        id,
        guardUserId: guardId,
      },
    });

    if (!exist) return;

    await this.prisma.guardNotification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }
}
