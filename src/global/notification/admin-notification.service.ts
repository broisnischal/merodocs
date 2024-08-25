import { Injectable } from '@nestjs/common';
import { AdminNotificationEnum } from '@prisma/client';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams } from '../../api/admin/common/interface';

type CreateNotificationService<T = AdminNotificationEnum> =
  T extends 'recent_poll'
    ? { type: T; digits: number; apartmentId: string }
    : { type: T; apartmentId: string; newTicket?: boolean };

@Injectable()
export class AdminNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(props: CreateNotificationService) {
    let message: string;

    switch (props.type) {
      case 'account_creation_request':
        message = `There is a new <strong>account creation request</strong>`;
        break;

      case 'recent_poll':
        message = `You got ${props.digits} response in your <strong>recent poll</strong>`;
        break;

      case 'move_out_request':
        message = `There is a new <strong>move-out request</strong>`;
        break;

      case 'maintenance_ticket':
        message = props.newTicket
          ? `A resident has created a new <strong>maintenance ticket</strong>`
          : `A resident has left you a message in a <strong>maintenance ticket</strong>`;
        break;

      case 'add_flat_request':
        message = `There is a new <strong>add flat request</strong>`;
        break;
    }

    return await this.prisma.adminNotification.create({
      data: {
        message,
        type: props.type,
        apartmentId: props.apartmentId,
      },
    });
  }

  async getAll(data: GetAllParams) {
    const { apartmentId } = data;
    return await this.prisma.adminNotification.getAllPaginated(
      {
        page: data.page,
        limit: data.limit,
      },
      {
        where: {
          apartmentId,
        },
        select: {
          id: true,
          type: true,
          message: true,
          read: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    );
  }

  async markAsRead({ id, apartmentId }: { id: string; apartmentId: string }) {
    return await this.prisma.adminNotification.update({
      where: { id, apartmentId },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(apartmentId: string) {
    return await this.prisma.adminNotification.updateMany({
      where: {
        apartmentId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}
