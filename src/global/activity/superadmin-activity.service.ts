import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogType } from 'src/api/superadmin/common/interface';
import { getPageDocs, pagination } from 'src/common/utils/pagination.util';
import { SuperAdmin } from '@prisma/client';

interface ActivityProps {
  message: string;
  type: ActivityLogType;
  loggedUserData: SuperAdmin;
  id?: string;
}

interface GetAllActivityProps {
  type: ActivityLogType;
  page: number;
  limit: number;
}

@Injectable()
export class SuperAdminActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(props: ActivityProps) {
    const activity = await this.prisma.superAdminActivityLog.create({
      data: {
        name: props.loggedUserData.name,
        message: props.message,
        type: props.type,
        createdById: props.loggedUserData.id,
        contactUsId: props.type === 'contactus' ? props.id : null,
      },
    });

    return activity;
  }

  async getAllWithPagination({ type, page, limit }: GetAllActivityProps) {
    const { skip } = pagination({
      page,
      limit,
    });
    const [data, count] = await Promise.all([
      this.prisma.superAdminActivityLog.findMany({
        where: {
          type,
        },
        take: limit,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          message: true,
          createdAt: true,
          createdById: true,
        },
      }),
      this.prisma.superAdminActivityLog.count({
        where: {
          type,
        },
      }),
    ]);
    const docs = getPageDocs({
      count,
      limit,
      page,
    });

    return { data, docs };
  }

  async getAll(apartmentId: string, type: ActivityLogType) {
    const activities = await this.prisma.superAdminActivityLog.existMany(
      apartmentId,
      {
        where: {
          type,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          message: true,
          createdAt: true,
          createdById: true,
        },
      },
    );

    return activities;
  }
}
