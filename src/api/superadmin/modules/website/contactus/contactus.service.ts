import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactUsStatusEnum } from '@prisma/client';
import {
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import { updateContactUsDto } from './dtos/update-contactus.dto';

@Injectable()
export class ContactUsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: SuperAdminActivityService,
  ) {}

  async getAll(data: GetAllParams) {
    const { filter, archive, limit, page } = data;

    const requests = await this.prisma.contactUs.getAllPaginated(
      { limit, page },
      {
        where:
          filter === ContactUsStatusEnum.pending
            ? { status: 'pending', archive }
            : filter === ContactUsStatusEnum.responded
              ? { status: 'responded', archive }
              : { archive },
        omit: { archive: true, updatedAt: true },
        include: {
          activityLogs: {
            select: {
              createdBy: {
                select: { name: true, role: { select: { name: true } } },
              },
              message: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    );

    return requests;
  }

  async update(data: UpdateParams<updateContactUsDto>) {
    const { id, postData, loggedUserData } = data;

    const { status } = postData;
    const valid = await this.prisma.contactUs.findUnique({
      where: { id, archive: false, status: 'pending' },
    });

    if (!valid) {
      throw new NotFoundException('Request not found');
    }

    const updated = await this.prisma.contactUs.update({
      where: { id },
      data: { status },
    });

    await this.activityService.create({
      loggedUserData,
      type: 'contactus',
      message: `changed the status to ${status}`,
      id: updated.id,
    });

    return updated;
  }

  async archiveOrUnarchive(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;
    const valid = await this.prisma.contactUs.findUnique({
      where: { id },
    });

    if (!valid) {
      throw new NotFoundException('Contact us not found');
    }

    const updated = await this.prisma.contactUs.update({
      where: { id },
      data: {
        archive: !valid.archive,
      },
    });

    await this.activityService.create({
      loggedUserData,
      type: 'contactus',
      message: `${updated.archive ? 'Archived' : 'Unarchived'} the request`,
      id: updated.id,
    });

    return updated;
  }

  async delete(data: DeleteParams) {
    const { id } = data;
    const valid = await this.prisma.contactUs.findUnique({
      where: { id, archive: true },
    });

    if (!valid) {
      throw new NotFoundException('Request not found');
    }
    const deleted = await this.prisma.contactUs.delete({
      where: { id },
    });

    return deleted;
  }
}
