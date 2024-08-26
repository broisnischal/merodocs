import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogType } from 'src/api/admin/common/interface';
import { getPageDocs, pagination } from 'src/common/utils/pagination.util';
import { AdminUser } from '@prisma/client';

interface ActivityProps {
  message: string;
  type: ActivityLogType;
  loggedUserData: AdminUser;
  blockId?: string;
}

interface GetAllActivityProps {
  type: ActivityLogType | ActivityLogType[];
  apartmentId: string;
  page: number;
  limit: number;
  blockId?: string;
}

@Injectable()
export class AdminActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(props: ActivityProps) {
    const activity = await this.prisma.adminActivityLog.create({
      data: {
        name: props.loggedUserData.name,
        message: props.message,
        type: props.type,
        apartmentId: props.loggedUserData.apartmentId,
        createdById: props.loggedUserData.id,
        blockId: props.blockId,
      },
    });

    return activity;
  }

  async getAllWithPagination({
    type,
    apartmentId,
    blockId,
    page,
    limit,
  }: GetAllActivityProps) {
    const { skip } = pagination({
      page,
      limit,
    });
    const [data, count] = await Promise.all([
      this.prisma.adminActivityLog.existMany(apartmentId, {
        where: {
          type: type instanceof Array ? { in: type } : type,
          blockId,
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
      this.prisma.adminActivityLog.count({
        where: {
          type: type instanceof Array ? { in: type } : type,
          apartmentId,
          blockId,
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
    const activities = await this.prisma.adminActivityLog.existMany(
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
