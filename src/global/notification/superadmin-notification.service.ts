import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminNotificationEnum } from '@prisma/client';

interface NotificationProps {
  type: SuperAdminNotificationEnum;
  name?: string;
  date?: Date;
}

@Injectable()
export class SuperAdminNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(props: NotificationProps) {
    let message: string;

    switch (props.type) {
      case 'expiring_soon':
        message = `${props.name} account is <strong>expiring soon</strong>`;
        break;

      case 'inactive_account':
        if (props.date) {
          const inactiveDate = new Date(props.date);
          const formattedDate = inactiveDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          message = `${props.name} has been <strong>inactive since ${formattedDate}</strong>`;
        } else {
          message = `${props.name} has been <strong>inactive</strong>`;
        }
        break;

      case 'report_issued_apartment':
        message = `There is a new <strong>report issued</strong>, from apartment: ${props.name}`;
        break;

      case 'report_issued_client':
        message = `There is a new <strong>report issued</strong>, from client: ${props.name}`;
        break;
    }

    return await this.prisma.superAdminNotification.create({
      data: {
        message,
        type: props.type,
      },
    });
  }

  async getAll(data: { page: number; limit: number }) {
    return await this.prisma.superAdminNotification.getAllPaginated(
      {
        page: data.page,
        limit: data.limit,
      },
      {
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

  async markAsRead({ id }: { id: string }) {
    return await this.prisma.superAdminNotification.update({
      where: { id },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead() {
    return await this.prisma.superAdminNotification.updateMany({
      where: {
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}
